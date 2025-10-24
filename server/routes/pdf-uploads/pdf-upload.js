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

// ========== HELPER FUNCTIONS ==========

/**
 * Normalize merchant name by removing address contamination
 * "SLING.COM 9601 S MERIDIAN..." → "SLING.COM"
 * "CUB FOODS #01693 1104 LAGOON..." → "CUB FOODS"
 */
function normalizeMerchantName(merchant) {
  if (!merchant || typeof merchant !== 'string') return merchant

  let normalized = merchant.trim()

  // Remove (RETURN) or similar parenthetical suffixes
  normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '')

  const patterns = [
    // Store/transaction numbers: # prefix, or 4-5+ digit store IDs (CHECK FIRST!)
    /\s+(?:#\d+|\d{4,}(?=\s))/,

    // Space followed by 1-3 letter code + 3+ digits: " QPS", " SUBSCR548", " ADS2070699131"
    /\s+[A-Z]{1,3}\d{3,}(?:\s|$)/,

    // Phone numbers: 7-10 consecutive digits with optional dashes/slashes
    /\s+\d{7,10}(?:\s|$|-|\/)/,

    // Building/Suite numbers: numbers followed by space and then typical address words (US + Portuguese/Spanish)
    /\s+\d{1,4}\s+(?:WOOD|BLACK|OPTUM|LYNDALE|LAGOON|LAKE|LINDEN|2ND|1ST|3RD|4TH|5TH|WASHINGTON|FULTON|MERIDIAN|MCKNIGHT|HENNEPIN|BLOOMINGTON|AVE|ST|BLVD|DRIVE|STREET|CIRCLE|SUITE|STE|APT|FLOOR|FLO|ROAD|RD|WAY|LANE|LN|EAST|WEST|BRICKELL|RUA|AV|AVENIDA|W\.|E\.|S\.|N\.)/,

    // Street addresses: digit(s) followed by direction (N/S/E/W/NW/SE) and street type
    /\s+\d+\s+(?:N|S|E|W|NW|NE|SE|SW)\s*\.?\s+(?:STREET|ST|AVENUE|AVE|BLVD|BOULEVARD|DRIVE|DR|ROAD|RD|WAY|LANE|LN|CIRCLE|CIR)/,

    // ZIP codes: exactly 5 digits
    /\s+\d{5}(?:\s|$)/,

    // City names (major US + international)
    /\s+(?:MINNEAPOLIS|SAINT\s+PAUL|CHICAGO|NEW\s+YORK|SAN\s+FRANCISCO|DENVER|BROOKLYN|MIAMI|SEATTLE|BOSTON|LOS\s+ANGELES|PHILADELPHIA|DALLAS|ATLANTA|HOUSTON|PHOENIX|BARUERI|PORTO\s+ALEGRE|VANCOUVER|TALLINN|QUEBEC|MONTREAL|EDINBURGH|SINGAPORE|WASHINGTON|MORRISVILLE|CEDAR\s+HILLS|SANTA\s+CLARA|LEAWOOD|COON\s+RAPIDS|BURLINGAME|SYLMAR|EDEN\s+PRAIRIE|BLOOMINGTON|BURNSVILLE|EAGAN|FALCON\s+HEIGHT|SOLANA\s+BEACH|SAINT\s+LOUIS|SAO\s+PAULO)\b/i,

    // State/Country codes: 2-letter state + optional USA
    /\s+(?:MN|WI|IL|CA|CO|NY|TX|FL|GA|OH|MA|PA|AZ|WA|NV|UT|NC|MO|DC)\s*(?:USA)?$/i,

    // International country codes and postal codes
    /\s+(?:CANADA|CAN|BRAZIL|BRA|BRABRA|ISRISR|SGPSGP|DUBEST|LNDGBR|QC\s+CAN)\b/i,

    // Portuguese/Spanish street indicators: RUA, AV, AVENIDA, etc
    /\s+(?:RUA|AV|AVENIDA|PÇA|PRAÇA)\b/i,

    // PMB (Private Mail Box) and similar abbreviations
    /\s+(?:PMB|PO\s+BOX)\b/i,

    // Any sequence of 8+ digits (long account/ID numbers)
    /\s+\d{8,}(?:\s|$)/
  ]

  for (const pattern of patterns) {
    const match = normalized.search(pattern)
    if (match >= 0) {
      normalized = normalized.substring(0, match).trim()
      break
    }
  }

  return normalized
}

/**
 * Generate deterministic transaction ID from date, merchant, amount
 */
function generateTransactionId(date, merchant, amount) {
  const str = `${date}${merchant}${amount}`
  return Buffer.from(str).toString('base64')
}

/**
 * Validate transaction has all required fields and correct types
 * @returns { valid: boolean, error?: string, amount?: number }
 */
function validateTransactionData(txn) {
  if (!txn.date || !txn.description || txn.amount === null || txn.amount === undefined || !txn.category) {
    return {
      valid: false,
      error: 'Missing required fields'
    }
  }

  const amount = parseFloat(txn.amount)
  if (isNaN(amount)) {
    return {
      valid: false,
      error: 'Invalid amount'
    }
  }

  return {
    valid: true,
    amount
  }
}

/**
 * Validate and clean transaction data, detecting address contamination
 */
function validateAndCleanTransactionData(txn) {
  const cleaned = { ...txn }
  const original = { ...txn }

  // Check if merchant contains obvious address patterns
  const hasAddressContamination = /\d+\s+(ST|AVE|BLVD|ROAD|STREET|LANE|DRIVE|RD|DR|WAY)/.test(txn.description) ||
                                  /\d{5}/.test(txn.description) ||
                                  /\b(USA|MN|CA|CO|NY|TX|FL|IL)\b/.test(txn.description)

  if (hasAddressContamination) {
    console.warn(`⚠️  Address contamination detected in merchant: "${txn.description}"`)

    // Normalize/clean
    cleaned.description = normalizeMerchantName(txn.description)

    // Log if it changed
    if (cleaned.description !== original.description) {
      console.log(`   Cleaned: "${original.description}" → "${cleaned.description}"`)
    }
  }

  return cleaned
}

/**
 * Insert single transaction into database
 * @returns { success: boolean, error?: string, isDuplicate?: boolean }
 */
function insertTransaction(db, txn, statementId, transactionId, amount) {
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
    return { success: true }
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Duplicate transaction', isDuplicate: true }
    }
    return { success: false, error: err.message }
  }
}

/**
 * Process all transactions from parsed statement, validate, and insert
 * @returns { insertedCount, transactionIds, skippedTransactions }
 */
function insertTransactionsInBatch(db, transactions, statementId) {
  let insertedCount = 0
  const transactionIds = []
  const skippedTransactions = []

  for (const txn of transactions) {
    try {
      // Clean transaction data
      const cleanedTxn = validateAndCleanTransactionData(txn)

      // Validate
      const validation = validateTransactionData(cleanedTxn)
      if (!validation.valid) {
        skippedTransactions.push({
          reason: validation.error,
          transaction: cleanedTxn
        })
        continue
      }

      const amount = validation.amount

      // Normalize merchant for ID generation
      const cleanMerchant = normalizeMerchantName(cleanedTxn.description)
      const transactionId = generateTransactionId(cleanedTxn.date, cleanMerchant, amount)

      // Insert
      const result = insertTransaction(db, cleanedTxn, statementId, transactionId, amount)

      if (result.success) {
        insertedCount++
        transactionIds.push(transactionId)
      } else if (result.isDuplicate) {
        skippedTransactions.push({
          reason: 'Duplicate transaction',
          transaction: cleanedTxn
        })
      } else {
        skippedTransactions.push({
          reason: result.error,
          transaction: cleanedTxn
        })
      }
    } catch (error) {
      console.error('Error processing transaction:', error)
      skippedTransactions.push({
        reason: error.message,
        transaction: txn
      })
    }
  }

  return { insertedCount, transactionIds, skippedTransactions }
}

/**
 * Smart duplicate handling algorithm
 * Groups duplicates, compares DB vs statement counts, adds missing with suffixes
 * @returns { additionalInserted: number }
 */
function processDuplicateTransactions(db, transactions, skippedTransactions, statementId) {
  console.log('\n========== PROCESSING DUPLICATES ==========')

  const duplicateGroups = new Map()

  // Group skipped duplicates by date+merchant+amount
  for (const skipped of skippedTransactions) {
    if (skipped.reason === 'Duplicate transaction') {
      const txn = skipped.transaction
      const amount = parseFloat(txn.amount)
      const key = `${txn.date}|${txn.description}|${amount}`

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, [])
      }
      duplicateGroups.get(key).push(txn)
    }
  }

  console.log(`Found ${duplicateGroups.size} duplicate groups to process`)

  let additionalInserted = 0

  // Process each duplicate group
  for (const [key, skippedTxns] of duplicateGroups.entries()) {
    const [date, merchant, amountStr] = key.split('|')
    const amount = parseFloat(amountStr)

    // Count in statement
    const statementCount = transactions.filter(t =>
      t.date === date &&
      t.description === merchant &&
      parseFloat(t.amount) === amount
    ).length

    // Count in DB
    const cleanMerchant = normalizeMerchantName(merchant)
    const baseId = generateTransactionId(date, cleanMerchant, amount)
    const dbCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE id = ? OR id LIKE ?
    `).get(baseId, `${baseId}-%`)
    const dbCount = dbCountResult.count

    console.log(`  ${date} ${merchant} $${amount}:`)
    console.log(`    - Statement has: ${statementCount}`)
    console.log(`    - DB has: ${dbCount}`)

    // Add missing ones
    if (statementCount > dbCount) {
      const toAdd = statementCount - dbCount
      console.log(`    - Adding ${toAdd} more...`)

      let nextSequence = dbCount

      for (let i = 0; i < toAdd && i < skippedTxns.length; i++) {
        const txn = skippedTxns[i]

        let transactionId
        if (nextSequence === 0) {
          transactionId = baseId
        } else {
          transactionId = `${baseId}-${nextSequence}`
        }

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

          additionalInserted++
          console.log(`    ✓ Inserted with ID: ${transactionId}`)
        } catch (err) {
          console.error(`    ✗ Error inserting ${transactionId}:`, err.message)
        }

        nextSequence++
      }
    } else {
      console.log(`    - Already complete, skipping`)
    }
  }

  console.log('========== END DUPLICATE PROCESSING ==========\n')
  return additionalInserted
}

/**
 * Get existing statement or create new one
 * @returns { statementId, revisionNumber, isNewStatement }
 */
function getOrCreateStatement(db, institution, month) {
  const existingStatement = db.prepare(`
    SELECT id, revision_number
    FROM statements
    WHERE institution = ? AND month = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(institution, month)

  if (existingStatement) {
    return {
      statementId: existingStatement.id,
      revisionNumber: existingStatement.revision_number + 1,
      isNewStatement: false
    }
  } else {
    const uploadDate = new Date().toISOString().split('T')[0]
    const result = db.prepare(`
      INSERT INTO statements (institution, month, upload_date, transaction_count, revision_number)
      VALUES (?, ?, ?, 0, 0)
    `).run(institution, month, uploadDate)

    return {
      statementId: result.lastInsertRowid,
      revisionNumber: 0,
      isNewStatement: true
    }
  }
}

/**
 * Update statement with final counts and revision
 * @returns { shouldReturn: boolean }
 */
function finalizeStatement(db, statementId, insertedCount, revisionNumber, isNewStatement) {
  if (insertedCount === 0) {
    if (isNewStatement) {
      db.prepare('DELETE FROM statements WHERE id = ?').run(statementId)
      console.log('No new transactions - deleted new statement record')
      return true
    } else {
      console.log('No new transactions - existing statement unchanged')
      return true
    }
  } else {
    db.prepare(`
      UPDATE statements
      SET transaction_count = transaction_count + ?,
          revision_number = ?
      WHERE id = ?
    `).run(insertedCount, revisionNumber, statementId)

    console.log(`Updated statement: +${insertedCount} transactions, revision ${revisionNumber}`)
    return false
  }
}

/**
 * Build success response JSON
 */
function buildUploadResponse(isNewStatement, revisionNumber, institution, month, insertedCount, skippedTransactions, transactionIds, statementId) {
  return {
    success: true,
    message: isNewStatement
      ? `Successfully uploaded statement from ${institution} (${month})`
      : `Successfully updated statement from ${institution} (${month}) - Revision ${revisionNumber}`,
    statement: {
      id: statementId,
      institution,
      month,
      transactionCount: insertedCount,
      skippedCount: skippedTransactions.length,
      revisionNumber: revisionNumber,
      isAmendment: !isNewStatement,
      transactionIds
    }
  }
}

/**
 * Build system prompt with category taxonomy and examples
 */
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

MERCHANT NAME EXTRACTION RULES:
- Extract ONLY the business name into the 'description' field
- Put the full address (street, city, state, zip) into the 'address' field separately
- DO NOT concatenate merchant name and address in the same field
- Examples of CORRECT format:
  * description: "SLING.COM", address: "9601 S MERIDIAN BLVD ENGLEWOOD CO 80112"
  * description: "APPLE.COM/BILL", address: "ONE APPLE PARK WAY CUPERTINO CA 95014"
  * description: "DD *DOORDASH", address: "303 2ND STREET CA 94107"
  * description: "ALDI", address: "2601 LYNDALE AVE MINNEAPOLIS MN 55408"
- Examples of WRONG format (DO NOT do this):
  ✗ description: "SLING.COM 9601 S MERIDIAN BLVD ENGLEWOOD 80112 CO USA"
  ✗ description: "APPLE.COM/BILL ONE APPLE PARK WAY"
- If merchant/description contains numbers and street references, extract to address field
- Consistency: Always use the bare merchant name only, never include address in merchant field

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

Reference format with real examples:
${examplesText}`
}

/**
 * Parse transactions using Claude AI
 */
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

  const maxTokens = 8192
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
          cache_control: { type: 'ephemeral' }
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

    // Extract JSON from response
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

// ========== MAIN ROUTER HANDLER ==========

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

    // Parse with AI
    const parsedData = await parseTransactionsWithAI(pdfText)
    const { institution, month, transactions } = parsedData

    if (!institution || !month || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'Failed to parse statement. Please ensure it is a valid bank/credit card statement.',
        details: parsedData
      })
    }

    // Get or create statement
    const { statementId, revisionNumber, isNewStatement } = getOrCreateStatement(db, institution, month)

    // Insert transactions in batch
    const { insertedCount, transactionIds, skippedTransactions } = insertTransactionsInBatch(
      db,
      transactions,
      statementId
    )

    // Process duplicate transactions
    const additionalInserted = processDuplicateTransactions(
      db,
      transactions,
      skippedTransactions,
      statementId
    )

    const totalInserted = insertedCount + additionalInserted

    // Finalize statement
    const shouldReturn = finalizeStatement(db, statementId, totalInserted, revisionNumber, isNewStatement)

    console.log('Inserted:', totalInserted, 'transactions')
    console.log('Skipped:', skippedTransactions.length, 'transactions')
    console.log('========== PDF UPLOAD COMPLETED ==========\n')

    // Handle zero inserts case
    if (shouldReturn) {
      return res.status(200).json({
        success: true,
        message: `All transactions from ${institution} (${month}) are already imported`,
        statement: {
          id: isNewStatement ? null : statementId,
          institution,
          month,
          transactionCount: 0,
          status: 'already_complete'
        }
      })
    }

    // Success response
    res.status(201).json(
      buildUploadResponse(isNewStatement, revisionNumber, institution, month, totalInserted, skippedTransactions, transactionIds, statementId)
    )
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
