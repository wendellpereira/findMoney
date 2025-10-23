import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';
import db from '../db/database.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});
console.log('----- ANTHROPIC_API_KEY -----', process.env.ANTHROPIC_API_KEY);  
// Initialize Anthropic client (lazily, when first needed)
let client;
function getAnthropicClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Helper function to generate transaction ID (deterministic hash)
function generateTransactionId(date, merchant, address, amount) {
  const str = `${date}${merchant}${address}${amount}`;
  return Buffer.from(str).toString('base64').substring(0, 20);
}

// Helper function to parse transactions using Claude AI
async function parseTransactionsWithAI(pdfText) {
  // Get existing categories from database
  const existingCategories = db.prepare(
    'SELECT DISTINCT category FROM transactions ORDER BY category'
  ).all().map(row => row.category);

  const categoryGuide = existingCategories.length > 0
    ? `IMPORTANT: This user has already categorized transactions with these categories:\n${existingCategories.join(', ')}\n\nPlease try to use these existing categories when they match the transaction type. However, if none of these categories fit well, you may suggest a new appropriate category name.\n\n`
    : 'You may suggest any appropriate category name for each transaction.\n\n';

  const prompt = `You are an expert at parsing bank and credit card statements and categorizing expenses. Extract transaction data from the following statement text.

${categoryGuide}
For each transaction, extract:
- Date (format: MM/DD/YYYY)
- Description (merchant name and/or transaction description)
- Address (if available - it usually starts with a number and then a street name and city and state and zip code)
- Amount (in dollars, as a positive number)
- Category (assign an appropriate category based on the merchant/description. Use existing categories when they match, or suggest new ones if needed)
- Institution name (the bank/card issuer name, usually at the top of the statement)
- Statement month/year (format: "Month Year", e.g., "September 2025")

Please return the data as a JSON object with this structure:
{
  "institution": "Institution Name",
  "month": "Month Year",
  "transactions": [
    {
      "date": "MM/DD/YYYY",
      "description": "Merchant description",
      "address": "Address",
      "amount": 123.45,
      "category": "Category Name"
    }
  ]
}

If any field except category is not available, use null. The amount must be a positive number. The category must never be null.

Here's the statement text:
${pdfText}`;

  const anthropicClient = getAnthropicClient();
  const message = await anthropicClient.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  // Extract JSON from the response
  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Could not extract JSON from AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

// POST /api/pdf-upload - Handle PDF upload and parsing
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Extract text from PDF
    const parser = new PDFParse({ data: req.file.buffer });
    await parser.load();
    const textResult = await parser.getText();
    const pdfText = textResult.text;

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ error: 'PDF appears to be empty or unreadable' });
    }

    // Parse transactions using Claude AI
    const parsedData = await parseTransactionsWithAI(pdfText);

    const { institution, month, transactions } = parsedData;

    if (!institution || !month || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'Failed to parse statement. Please ensure it is a valid bank/credit card statement.',
        details: parsedData
      });
    }

    // Create statement record
    const uploadDate = new Date().toISOString().split('T')[0];
    const insertStatement = db.prepare(`
      INSERT INTO statements (institution, month, upload_date, transaction_count)
      VALUES (?, ?, ?, ?)
    `);

    const statementResult = insertStatement.run(
      institution,
      month,
      uploadDate,
      transactions.length
    );

    const statementId = statementResult.lastInsertRowid;

    let insertedCount = 0;
    const transactionIds = [];

    for (const txn of transactions) {
      try {
        // Skip transactions with missing critical data
        if (!txn.date || !txn.description || txn.amount === null || txn.amount === undefined || !txn.category) {
          continue;
        }

        // Parse amount to ensure it's a number
        const amount = parseFloat(txn.amount);
        if (isNaN(amount)) {
          continue;
        }

        // Generate deterministic ID
        const transactionId = generateTransactionId(
          txn.date,
          txn.description,
          txn.address || '',
          amount
        );

        // Insert transaction with category string
        try {
          db.prepare(`
            INSERT INTO transactions (id, statement_id, date, description, address, amount, merchant, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            transactionId,
            statementId,
            txn.date,
            txn.description,
            txn.address || null,
            amount,
            txn.description,
            txn.category
          );

          insertedCount++;
          transactionIds.push(transactionId);
        } catch (err) {
          // Skip duplicate transactions (same ID)
          if (err.message.includes('UNIQUE constraint failed')) {
            continue;
          }
          throw err;
        }
      } catch (error) {
        console.error('Error inserting transaction:', error);
        continue;
      }
    }

    // Update transaction count
    db.prepare('UPDATE statements SET transaction_count = ? WHERE id = ?').run(
      insertedCount,
      statementId
    );

    res.status(201).json({
      success: true,
      message: `Successfully uploaded statement from ${institution} (${month})`,
      statement: {
        id: statementId,
        institution,
        month,
        uploadDate,
        transactionCount: insertedCount,
        transactionIds
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);

    if (error.message.includes('API')) {
      return res.status(500).json({
        error: 'Failed to process PDF with AI service',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to process PDF',
      details: error.message
    });
  }
});

export default router;
