import express from 'express'
import db from '../db/database.js'
import { predictDuplicate, analyzeMatch } from '../ml/merchantDuplicateDetector.js'

const router = express.Router()

// Helper to regenerate transaction ID (same logic as in pdf-upload.js)
function generateTransactionId(date, merchant, amount) {
  const str = `${date}${merchant}${amount}`
  return Buffer.from(str).toString('base64')
}

/**
 * POST /api/admin/migrate-transaction-ids
 *
 * Migrates existing transaction IDs from old format to new format
 * Old format: Base64(date+merchant+address+amount).substring(0, 20)
 * New format: Base64(date+merchant+amount) - full length, no substring
 *
 * This is a one-time migration endpoint. Requires confirmation in request body.
 */
router.post('/migrate-transaction-ids', (req, res) => {
  // Require explicit confirmation
  if (req.body.confirm !== true) {
    return res.status(400).json({
      error: 'Migration requires confirmation',
      message: 'Send { "confirm": true } in request body to proceed'
    })
  }

  console.log('\n========== STARTING TRANSACTION ID MIGRATION ==========')

  try {
    // Get all transactions with their necessary fields
    const allTransactions = db.prepare(
      'SELECT id, date, merchant, amount FROM transactions ORDER BY id'
    ).all()

    console.log(`Found ${allTransactions.length} transactions to process`)

    let migratedCount = 0
    let skippedCount = 0
    let sequenceAppliedCount = 0
    const errors = []

    // Process each transaction
    for (const txn of allTransactions) {
      const oldId = txn.id
      const newBaseId = generateTransactionId(txn.date, txn.merchant, txn.amount)
      let newId = newBaseId
      let sequence = 0

      // Check if new base ID already exists, append suffix until unique
      while (db.prepare('SELECT id FROM transactions WHERE id = ? AND id != ?').get(newId, oldId)) {
        sequence++
        newId = `${newBaseId}-${sequence}`
      }

      // Update the transaction ID if it changed
      if (oldId === newId) {
        // ID didn't change, skip
        skippedCount++
        continue
      }

      try {
        db.prepare('UPDATE transactions SET id = ? WHERE id = ?').run(newId, oldId)
        migratedCount++

        if (sequence > 0) {
          sequenceAppliedCount++
          console.log(`  ✓ ${oldId.substring(0, 20)}... → ${newId}`)
        } else {
          console.log(`  ✓ ${oldId.substring(0, 20)}... → ${newId}`)
        }
      } catch (err) {
        skippedCount++
        errors.push({
          oldId,
          newId,
          error: err.message
        })
        console.error(`  ✗ Failed to migrate ${oldId}:`, err.message)
      }
    }

    console.log('\n========== MIGRATION COMPLETE ==========')
    console.log(`Total transactions: ${allTransactions.length}`)
    console.log(`Migrated: ${migratedCount}`)
    console.log(`With sequential suffix: ${sequenceAppliedCount}`)
    console.log(`Skipped: ${skippedCount}`)
    console.log(`Errors: ${errors.length}`)
    console.log('========== END MIGRATION ==========\n')

    res.json({
      success: true,
      migratedCount,
      skippedCount,
      sequenceAppliedCount,
      totalTransactions: allTransactions.length,
      errors,
      message: `Successfully migrated ${migratedCount} transaction IDs to new format`
    })
  } catch (error) {
    console.error('Migration error:', error)
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    })
  }
})

/**
 * Helper to normalize merchant name (remove address contamination)
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
 * POST /api/admin/deduplicate-merchants
 *
 * Detects and consolidates merchant name duplicates caused by AI parsing inconsistencies
 * Groups merchants by normalized name, consolidates to shortest canonical version
 * Flags ambiguous cases for manual review
 *
 * Request body:
 *   - confirm: true (required)
 *   - autoFix: true/false (default: true for auto-fix, false for dry-run)
 */
router.post('/deduplicate-merchants', (req, res) => {
  // Require explicit confirmation
  if (req.body.confirm !== true) {
    return res.status(400).json({
      error: 'Deduplication requires confirmation',
      message: 'Send { "confirm": true } in request body to proceed'
    })
  }

  const autoFix = req.body.autoFix !== false // Default to true

  console.log('\n========== STARTING MERCHANT DEDUPLICATION ==========')
  console.log(`Mode: ${autoFix ? 'AUTO-FIX' : 'DRY-RUN'}`)

  try {
    // Get all unique merchants
    const allMerchants = db.prepare('SELECT DISTINCT merchant FROM transactions ORDER BY merchant').all()
    console.log(`Found ${allMerchants.length} unique merchants to analyze`)

    // Group by normalized name
    const groups = new Map()
    for (const row of allMerchants) {
      const normalized = normalizeMerchantName(row.merchant)
      if (!groups.has(normalized)) {
        groups.set(normalized, [])
      }
      groups.get(normalized).push(row.merchant)
    }

    // Find duplicates (groups with more than 1 variant)
    const duplicates = Array.from(groups.entries())
      .filter(([_, variants]) => variants.length > 1)

    console.log(`Found ${duplicates.length} duplicate groups`)

    const changes = []
    const flagged = []
    let transactionsUpdated = 0

    // Process each duplicate group
    for (const [normalized, variants] of duplicates) {
      // Pick canonical: shortest version
      const canonical = variants.reduce((a, b) => a.length < b.length ? a : b)

      // Check if flagworthy (multiple distinct base names or significant differences)
      const isFlagworthy = variants.length > 2 ||
                          variants.some(v => {
                            // Count how different they are
                            const vNorm = normalizeMerchantName(v)
                            return vNorm !== canonical && vNorm.length > 5
                          })

      const transactionCount = db.prepare(
        'SELECT COUNT(*) as count FROM transactions WHERE merchant IN (' +
        variants.map(() => '?').join(',') + ')'
      ).get(...variants).count

      const changeRecord = {
        normalized,
        variants: variants.sort(),
        canonical,
        transactionCount,
        status: isFlagworthy ? 'flag_for_review' : 'updated'
      }

      if (isFlagworthy) {
        flagged.push({
          ...changeRecord,
          reason: 'Multiple distinct variants - may need manual review'
        })
        console.log(`⚠️  FLAGGED: ${normalized} (${variants.length} variants)`)
      } else {
        changes.push(changeRecord)
        console.log(`✓ READY: ${normalized} → ${canonical}`)
      }

      // Auto-fix non-flagged duplicates
      if (autoFix && !isFlagworthy) {
        for (const variant of variants) {
          if (variant !== canonical) {
            const txns = db.prepare(
              'SELECT id, date, merchant, amount FROM transactions WHERE merchant = ?'
            ).all(variant)

            for (const txn of txns) {
              const newId = generateTransactionId(txn.date, canonical, txn.amount)

              try {
                const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(newId)

                if (existing) {
                  // Delete old transaction (new one already exists)
                  db.prepare('DELETE FROM transactions WHERE id = ?').run(txn.id)
                  transactionsUpdated++
                  console.log(`   - Deleted duplicate: ${txn.id}`)
                } else {
                  // Update to canonical merchant and new ID
                  db.prepare(
                    'UPDATE transactions SET merchant = ?, id = ? WHERE id = ?'
                  ).run(canonical, newId, txn.id)
                  transactionsUpdated++
                  console.log(`   - Updated: ${txn.id} → ${newId.substring(0, 20)}...`)
                }
              } catch (err) {
                console.error(`   - Error updating ${txn.id}:`, err.message)
              }
            }
          }
        }
      }
    }

    console.log('\n========== DEDUPLICATION COMPLETE ==========')
    console.log(`Total merchants: ${allMerchants.length}`)
    console.log(`Duplicate groups: ${duplicates.length}`)
    console.log(`Updated: ${changes.length}`)
    console.log(`Flagged: ${flagged.length}`)
    console.log(`Transactions updated: ${transactionsUpdated}`)
    console.log('========== END DEDUPLICATION ==========\n')

    res.json({
      success: true,
      summary: {
        merchantsAnalyzed: allMerchants.length,
        duplicateGroupsFound: duplicates.length,
        transactionsUpdated,
        flaggedForReview: flagged.length
      },
      changes,
      flagged,
      mode: autoFix ? 'auto_fix' : 'dry_run',
      message: autoFix
        ? `Fixed ${transactionsUpdated} transactions across ${changes.length} merchant groups`
        : `Identified ${duplicates.length} duplicate groups (${flagged.length} flagged for review)`
    })
  } catch (error) {
    console.error('Deduplication error:', error)
    res.status(500).json({
      success: false,
      error: 'Deduplication failed',
      details: error.message
    })
  }
})

/**
 * POST /api/admin/deduplicate-transactions
 *
 * Interactive endpoint for manual transaction deduplication
 * Returns potential duplicates with full transaction details
 * User selects canonical merchant, endpoint updates and deduplicates
 *
 * Request body (dry-run):
 *   - action: "analyze" - Returns potential duplicates grouped by similarity
 *
 * Request body (apply fix):
 *   - action: "fix"
 *   - fixes: [{ groupId: string, canonicalMerchant: string, transactionIds: string[] }]
 */
router.post('/deduplicate-transactions', (req, res) => {
  if (!req.body.action) {
    return res.status(400).json({
      error: 'Missing action',
      message: 'Specify action: "analyze" or "fix"'
    })
  }

  const { action, fixes } = req.body

  try {
    if (action === 'analyze') {
      return analyzeTransactionDuplicates(res)
    } else if (action === 'fix') {
      return fixTransactionDuplicates(res, fixes)
    } else {
      return res.status(400).json({
        error: 'Unknown action',
        message: 'Use "analyze" or "fix"'
      })
    }
  } catch (error) {
    console.error('Transaction deduplication error:', error)
    res.status(500).json({
      success: false,
      error: 'Transaction deduplication failed',
      details: error.message
    })
  }
})

/**
 * Analyze transactions for potential duplicates
 * Groups by date+amount, returns merchants that could be duplicates
 */
function analyzeTransactionDuplicates(res) {
  console.log('\n========== ANALYZING TRANSACTION DUPLICATES ==========')

  // Get all transactions with normalized names
  const allTransactions = db.prepare(`
    SELECT id, date, description, merchant, amount, category, address
    FROM transactions
    ORDER BY date, amount, merchant
  `).all()

  console.log(`Analyzing ${allTransactions.length} transactions...`)

  // Group by date+amount (potential duplicates)
  const groups = new Map()
  for (const txn of allTransactions) {
    const key = `${txn.date}|${txn.amount}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(txn)
  }

  // Find groups with multiple merchants (potential duplicates)
  const potentialDuplicates = []
  for (const [key, transactions] of groups.entries()) {
    const uniqueMerchants = new Set(transactions.map(t => t.merchant))
    if (uniqueMerchants.size > 1 && transactions.length > 1) {
      const [date, amount] = key.split('|')
      potentialDuplicates.push({
        groupId: Buffer.from(key).toString('base64'),
        date,
        amount: parseFloat(amount),
        merchants: Array.from(uniqueMerchants),
        transactions: transactions.map(t => ({
          id: t.id,
          merchant: t.merchant,
          description: t.description,
          address: t.address,
          category: t.category
        }))
      })
    }
  }

  console.log(`Found ${potentialDuplicates.length} potential duplicate groups`)
  console.log('========== ANALYSIS COMPLETE ==========\n')

  res.json({
    success: true,
    summary: {
      totalTransactions: allTransactions.length,
      potentialDuplicateGroups: potentialDuplicates.length,
      potentialDuplicateTransactions: potentialDuplicates.reduce((sum, g) => sum + g.transactions.length, 0)
    },
    duplicates: potentialDuplicates
  })
}

/**
 * Apply fixes to transaction duplicates
 */
function fixTransactionDuplicates(res, fixes) {
  if (!fixes || !Array.isArray(fixes) || fixes.length === 0) {
    return res.status(400).json({
      error: 'Invalid fixes',
      message: 'Provide array of fixes with { groupId, canonicalMerchant, transactionIds }'
    })
  }

  console.log('\n========== FIXING TRANSACTION DUPLICATES ==========')

  const results = []
  let updatedCount = 0
  let deletedCount = 0

  for (const fix of fixes) {
    const { groupId, canonicalMerchant, transactionIds } = fix

    if (!canonicalMerchant || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      results.push({
        groupId,
        success: false,
        error: 'Invalid fix format'
      })
      continue
    }

    console.log(`\nProcessing group ${groupId}...`)
    console.log(`  Canonical merchant: ${canonicalMerchant}`)
    console.log(`  Transactions to consolidate: ${transactionIds.length}`)

    try {
      // Get all transactions in this group
      const txns = db.prepare('SELECT id, date, merchant, amount FROM transactions WHERE id IN (' +
        transactionIds.map(() => '?').join(',') + ')').all(...transactionIds)

      // Determine which transaction to keep and which to delete
      let primaryTxn = null
      const secondaryTxns = []

      for (const txn of txns) {
        if (txn.merchant === canonicalMerchant) {
          if (!primaryTxn) {
            primaryTxn = txn
          } else {
            secondaryTxns.push(txn)
          }
        } else {
          secondaryTxns.push(txn)
        }
      }

      // If no primary with canonical merchant, use first transaction
      if (!primaryTxn) {
        primaryTxn = txns[0]
        const rest = txns.slice(1)
        secondaryTxns.push(...rest)
      }

      // Update primary transaction to canonical merchant
      if (primaryTxn.merchant !== canonicalMerchant) {
        const newId = generateTransactionId(primaryTxn.date, canonicalMerchant, primaryTxn.amount)

        // Check if new ID already exists
        const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(newId)
        if (!existing) {
          db.prepare('UPDATE transactions SET merchant = ?, id = ? WHERE id = ?')
            .run(canonicalMerchant, newId, primaryTxn.id)
          console.log(`  ✓ Updated primary: ${primaryTxn.id} → ${newId.substring(0, 20)}...`)
          updatedCount++
        } else {
          console.log(`  ⚠️  New ID already exists, deleting old: ${primaryTxn.id}`)
          db.prepare('DELETE FROM transactions WHERE id = ?').run(primaryTxn.id)
          deletedCount++
        }
      }

      // Delete secondary transactions
      for (const secondary of secondaryTxns) {
        db.prepare('DELETE FROM transactions WHERE id = ?').run(secondary.id)
        console.log(`  ✓ Deleted duplicate: ${secondary.id}`)
        deletedCount++
      }

      results.push({
        groupId,
        success: true,
        updated: 1,
        deleted: secondaryTxns.length
      })
    } catch (err) {
      console.error(`  ✗ Error processing group:`, err.message)
      results.push({
        groupId,
        success: false,
        error: err.message
      })
    }
  }

  console.log('\n========== FIX COMPLETE ==========')
  console.log(`Transactions updated: ${updatedCount}`)
  console.log(`Transactions deleted: ${deletedCount}`)
  console.log('========== END FIX ==========\n')

  res.json({
    success: true,
    summary: {
      fixesApplied: fixes.length,
      successful: results.filter(r => r.success).length,
      transactionsUpdated: updatedCount,
      transactionsDeleted: deletedCount
    },
    results
  })
}

/**
 * POST /api/admin/ml-duplicate-detection
 *
 * Uses machine learning algorithms to find likely duplicate merchants
 * No date/amount matching required - pure string similarity based
 *
 * Request body:
 *   - threshold: 0.60-0.95 (default: 0.75)
 *     - 0.95+ = very conservative (only obvious duplicates)
 *     - 0.75-0.85 = balanced (recommended)
 *     - 0.60-0.75 = aggressive (catch more, requires review)
 *   - action: "analyze" = show likely duplicates
 *   - action: "consolidate" = auto-consolidate high-confidence matches
 *
 * Response includes ML scores and explanations for each match
 */
router.post('/ml-duplicate-detection', (req, res) => {
  const { threshold = 0.75, action = 'analyze' } = req.body

  if (threshold < 0.5 || threshold > 0.95) {
    return res.status(400).json({
      error: 'Invalid threshold',
      message: 'Threshold must be between 0.5 and 0.95'
    })
  }

  console.log('\n========== ML DUPLICATE DETECTION ==========')
  console.log(`Threshold: ${(threshold * 100).toFixed(1)}%`)

  try {
    // Get all unique merchants
    const allMerchants = db
      .prepare('SELECT DISTINCT merchant FROM transactions ORDER BY merchant')
      .all()
      .map(row => row.merchant)

    console.log(`Analyzing ${allMerchants.length} merchants...`)

    // Find duplicates using ML
    const duplicatePairs = []
    const processedPairs = new Set()

    for (let i = 0; i < allMerchants.length; i++) {
      for (let j = i + 1; j < allMerchants.length; j++) {
        const m1 = allMerchants[i]
        const m2 = allMerchants[j]
        const pairKey = `${i}|${j}`

        if (processedPairs.has(pairKey)) continue
        processedPairs.add(pairKey)

        const analysis = analyzeMatch(m1, m2)
        if (analysis.combinedScore >= threshold) {
          duplicatePairs.push({
            merchant1: m1,
            merchant2: m2,
            score: analysis.combinedScore,
            confidence:
              analysis.combinedScore >= 0.85 ? 'HIGH' : analysis.combinedScore >= 0.75 ? 'MEDIUM' : 'LOW',
            analysis: analysis.individualScores,
            recommendation:
              analysis.combinedScore >= 0.85
                ? 'Safe to auto-consolidate'
                : analysis.combinedScore >= 0.75
                  ? 'Review before consolidating'
                  : 'Manual review recommended'
          })
        }
      }
    }

    // Group duplicates into clusters
    const groups = new Map()
    const used = new Set()

    for (const pair of duplicatePairs.sort((a, b) => b.score - a.score)) {
      const { merchant1, merchant2 } = pair

      if (used.has(merchant1) || used.has(merchant2)) continue

      const groupKey = merchant1
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          canonical: merchant1,
          variants: [merchant1],
          pairs: []
        })
      }

      groups.get(groupKey).variants.push(merchant2)
      groups.get(groupKey).pairs.push(pair)
      used.add(merchant2)
    }

    const groupsArray = Array.from(groups.values())

    console.log(`Found ${duplicatePairs.length} potential duplicate pairs`)
    console.log(`Grouped into ${groupsArray.length} clusters`)
    console.log('========== END ANALYSIS ==========\n')

    if (action === 'analyze') {
      return res.json({
        success: true,
        summary: {
          merchantsAnalyzed: allMerchants.length,
          duplicatePairsFound: duplicatePairs.length,
          duplicateGroupsFound: groupsArray.length,
          threshold: `${(threshold * 100).toFixed(1)}%`
        },
        duplicatePairs: duplicatePairs.map(p => ({
          merchant1: p.merchant1,
          merchant2: p.merchant2,
          mlScore: parseFloat(p.score.toFixed(3)),
          confidence: p.confidence,
          recommendation: p.recommendation,
          algorithms: {
            jaroWinkler: parseFloat(p.analysis.jaroWinkler.toFixed(3)),
            levenshtein: parseFloat(p.analysis.levenshtein.toFixed(3)),
            jaccard: parseFloat(p.analysis.jaccard.toFixed(3)),
            prefix: parseFloat(p.analysis.prefix.toFixed(3)),
            length: parseFloat(p.analysis.length.toFixed(3))
          }
        })),
        duplicateGroups: groupsArray.map(g => ({
          canonical: g.canonical,
          variants: g.variants,
          count: g.variants.length,
          pairs: g.pairs.map(p => ({
            merchant1: p.merchant1,
            merchant2: p.merchant2,
            score: parseFloat(p.score.toFixed(3))
          }))
        })),
        mode: 'analyze'
      })
    } else if (action === 'consolidate') {
      // High-confidence consolidation
      const highConfidence = duplicatePairs.filter(p => p.score >= 0.85)

      if (highConfidence.length === 0) {
        return res.json({
          success: true,
          message: `No high-confidence duplicates (>85%) found at ${(threshold * 100).toFixed(1)}% threshold`,
          consolidated: 0
        })
      }

      let consolidated = 0

      for (const pair of highConfidence) {
        try {
          // Get transaction counts for each merchant
          const count1 = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE merchant = ?').get(pair.merchant1)
            .count
          const count2 = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE merchant = ?').get(pair.merchant2)
            .count

          // Keep the one with more transactions as canonical
          const canonical = count1 >= count2 ? pair.merchant1 : pair.merchant2
          const toDelete = count1 >= count2 ? pair.merchant2 : pair.merchant1

          // Update all transactions
          const txns = db
            .prepare('SELECT id, date, amount FROM transactions WHERE merchant = ?')
            .all(toDelete)

          for (const txn of txns) {
            const newId = generateTransactionId(txn.date, canonical, txn.amount)

            try {
              db.prepare('UPDATE transactions SET merchant = ?, id = ? WHERE id = ?').run(canonical, newId, txn.id)
              consolidated++
            } catch (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                db.prepare('DELETE FROM transactions WHERE id = ?').run(txn.id)
                consolidated++
              }
            }
          }
        } catch (err) {
          console.error(`Error consolidating ${pair.merchant1} and ${pair.merchant2}:`, err.message)
        }
      }

      res.json({
        success: true,
        message: `Auto-consolidated ${highConfidence.length} high-confidence duplicate pairs`,
        consolidated,
        mode: 'consolidate'
      })
    } else {
      res.status(400).json({
        error: 'Invalid action',
        message: 'Use "analyze" or "consolidate"'
      })
    }
  } catch (error) {
    console.error('ML duplicate detection error:', error)
    res.status(500).json({
      success: false,
      error: 'ML duplicate detection failed',
      details: error.message
    })
  }
})

export default router
