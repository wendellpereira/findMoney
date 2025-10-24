import express from 'express'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import { Anthropic } from '@anthropic-ai/sdk'
import db from '../../db/database.js'
import { PARSING_EXAMPLES, CATEGORY_TAXONOMY } from './constants.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Initialize Anthropic client (lazily, when first needed)
let client
function getAnthropicClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

// Helper function to generate transaction ID (deterministic hash)
function generateTransactionId(date, merchant, amount) {
  const str = `${date}${merchant}${amount}`
  return Buffer.from(str).toString('base64')
}

// Helper function to build the system prompt with examples and category taxonomy
function buildSystemPrompt(existingCategories) {
  const categoryGuide = existingCategories.length > 0
    ? `Existing user categories: ${existingCategories.join(', ')}\nPrefer these when applicable. Create new categories only if none fit.`
    : ''

  // Build category taxonomy reference
  const taxonomyText = Object.entries(CATEGORY_TAXONOMY).map(([catName, catData]) =>
    `${catName}: ${catData.description}\nExamples: ${catData.merchants.slice(0, 3).join(', ')}`
  ).join('\n')

  // Format all 104 examples
  const examplesText = PARSING_EXAMPLES.map((ex) => `
{"date":"${ex.output.date}","description":"${ex.output.description}","address":"${ex.output.address}","amount":${ex.output.amount},"category":"${ex.output.category}"}`).join('\n')

  return `You are a bank statement parser. Extract ALL transactions from the provided text and return ONLY valid JSON (no preamble, no explanation, no follow-up questions).

${categoryGuide}

CATEGORY REFERENCE TAXONOMY:
${taxonomyText}

Output exactly this structure for EVERY transaction found:
{
  "institution": "Bank Name",
  "month": "Month Year",
  "transactions": [
    {"date":"MM/DD/YYYY","description":"text","address":"text or null","amount":0.00,"category":"text"}
  ]
}

Critical rules:
1. EXTRACT EVERY SINGLE TRANSACTION - do not truncate or limit
2. Return ONLY the JSON object - no other text
3. Do not ask questions or explain
4. Use null for missing address only
5. All other fields are required
6. Amount is always positive number
7. Double-check transaction count matches statement
8. Use categories from the taxonomy when applicable
9. Be consistent with merchant classification
10. The address usually starts with a number in the description field followed by street, city and state and possible country

Reference format with real examples:
${examplesText}`
}

// Helper function to parse transactions using Claude AI
async function parseTransactionsWithAI(pdfText) {
  console.log('\n========== ANTHROPIC API REQUEST ==========')

  // Get existing categories from database
  const existingCategories = db.prepare(
    'SELECT DISTINCT category FROM transactions ORDER BY category'
  ).all().map(row => row.category)

  console.log('Existing categories:', existingCategories.length, existingCategories)
  console.log('PDF text length:', pdfText.length, 'characters')

  // Build the system prompt
  const systemPrompt = buildSystemPrompt(existingCategories)

  const anthropicClient = getAnthropicClient()

  const maxTokens = 8192 // Increased from 4096 to handle larger statements
  const model = 'claude-3-5-haiku-20241022'

  try {
    console.log(`Model: ${model}`)
    console.log(`Max tokens: ${maxTokens}`)
    console.log(`System prompt length: ${systemPrompt.length} characters`)

    const message = await anthropicClient.messages.create({
      model: model,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' } // Cache system message for cost savings
        }
      ],
      messages: [
        {
          role: 'user',
          content: `Here's the bank statement to parse:\n\n${pdfText}`
        }
      ]
    })

    console.log('\n========== ANTHROPIC API RESPONSE ==========')
    console.log(`Stop reason: ${message.stop_reason}`)
    console.log(`Input tokens: ${message.usage.input_tokens}`)
    console.log(`Output tokens: ${message.usage.output_tokens}`)

    // Log cache info if available
    if (message.usage.cache_creation_input_tokens) {
      console.log(`\n========== Cache creation tokens: ${message.usage.cache_creation_input_tokens}`)
    }
    if (message.usage.cache_read_input_tokens) {
      console.log(`\n========== Cache read tokens: ${message.usage.cache_read_input_tokens} (90% cost savings!)`)
    }

    const responseText = message.content[0].text
    console.log('Response length:', responseText.length, 'characters')
    console.log('Response text (first 1000 chars):', responseText.substring(0, 1000))

    // Extract JSON from response - find the opening { and extract to the last }
    const jsonStart = responseText.indexOf('{')
    const jsonEnd = responseText.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error('ERROR: Could not find JSON in response. Full response:')
      console.error(responseText)
      throw new Error('Could not extract JSON from AI response')
    }

    const jsonString = responseText.substring(jsonStart, jsonEnd + 1)
    let parsedData

    try {
      parsedData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('ERROR: Failed to parse extracted JSON:')
      console.error('JSON string:', jsonString.substring(0, 500))
      console.error('Parse error:', parseError.message)
      throw new Error(`Invalid JSON from AI: ${parseError.message}`)
    }

    // Validate the response structure
    if (!parsedData.institution || !parsedData.month || !Array.isArray(parsedData.transactions)) {
      console.error('ERROR: Invalid response structure')
      console.error('Got:', JSON.stringify(parsedData).substring(0, 200))
      throw new Error('Invalid response structure from AI')
    }

    console.log('Successfully parsed:', parsedData.transactions.length, 'transactions')
    console.log('Institution:', parsedData.institution)
    console.log('Month:', parsedData.month)
    console.log('========== END API RESPONSE ==========\n')

    return parsedData
  } catch (error) {
    console.error('ERROR during API call:', error.message)
    throw error
  }
}

// POST /api/pdf-upload - Handle PDF upload and parsing
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    console.log('\n========== PDF UPLOAD STARTED ==========')
    console.log('File name:', req.file.originalname)
    console.log('File size:', req.file.size, 'bytes')

    // Extract text from PDF
    const parser = new PDFParse({ data: req.file.buffer })
    await parser.load()
    const textResult = await parser.getText()
    const pdfText = textResult.text

    console.log('PDF extracted text length:', pdfText.length, 'characters')

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ error: 'PDF appears to be empty or unreadable' })
    }

    // Parse transactions using Claude AI
    const parsedData = await parseTransactionsWithAI(pdfText)

    const { institution, month, transactions } = parsedData

    if (!institution || !month || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'Failed to parse statement. Please ensure it is a valid bank/credit card statement.',
        details: parsedData
      })
    }

    // Create statement record
    const uploadDate = new Date().toISOString().split('T')[0]
    const insertStatement = db.prepare(`
      INSERT INTO statements (institution, month, upload_date, transaction_count)
      VALUES (?, ?, ?, ?)
    `)

    const statementResult = insertStatement.run(
      institution,
      month,
      uploadDate,
      transactions.length
    )

    const statementId = statementResult.lastInsertRowid

    let insertedCount = 0
    const transactionIds = []
    const skippedTransactions = []

    for (const txn of transactions) {
      try {
        // Skip transactions with missing critical data
        if (!txn.date || !txn.description || txn.amount === null || txn.amount === undefined || !txn.category) {
          skippedTransactions.push({
            reason: 'Missing required fields',
            transaction: txn
          })
          continue
        }

        // Parse amount to ensure it's a number
        const amount = parseFloat(txn.amount)
        if (isNaN(amount)) {
          skippedTransactions.push({
            reason: 'Invalid amount',
            transaction: txn
          })
          continue
        }

        // Generate deterministic ID
        const transactionId = generateTransactionId(
          txn.date,
          txn.description,
          amount
        )

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
          )

          insertedCount++
          transactionIds.push(transactionId)
        } catch (err) {
          // Skip duplicate transactions (same ID)
          if (err.message.includes('UNIQUE constraint failed')) {
            skippedTransactions.push({
              reason: 'Duplicate transaction',
              transaction: txn
            })
            continue
          }
          throw err
        }
      } catch (error) {
        console.error('Error inserting transaction:', error)
        skippedTransactions.push({
          reason: error.message,
          transaction: txn
        })
        continue
      }
    }

    // Update transaction count
    db.prepare('UPDATE statements SET transaction_count = ? WHERE id = ?').run(
      insertedCount,
      statementId
    )

    console.log('Inserted:', insertedCount, 'transactions')
    console.log('Skipped:', skippedTransactions.length, 'transactions')
    if (skippedTransactions.length > 0) {
      console.log('Skipped details:', skippedTransactions)
    }
    console.log('========== PDF UPLOAD COMPLETED ==========\n')

    res.status(201).json({
      success: true,
      message: `Successfully uploaded statement from ${institution} (${month})`,
      statement: {
        id: statementId,
        institution,
        month,
        uploadDate,
        transactionCount: insertedCount,
        skippedCount: skippedTransactions.length,
        transactionIds
      }
    })
  } catch (error) {
    console.error('Error processing PDF:', error)

    if (error.message.includes('API')) {
      return res.status(500).json({
        error: 'Failed to process PDF with AI service',
        details: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to process PDF',
      details: error.message
    })
  }
})

export default router
