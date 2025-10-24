/**
 * Test file to demonstrate ML duplicate detection
 * Run with: node test-ml-duplicates.js
 *
 * LEARNING: This shows how the ML algorithms work on real merchant data
 */

import {
  calculateSimilarityScore,
  predictDuplicate,
  findDuplicateGroups,
  analyzeMatch
} from './server/ml/merchantDuplicateDetector.js'

console.log('========================================')
console.log('ML DUPLICATE DETECTION - LEARNING DEMO')
console.log('========================================\n')

// Test cases from your data
const testCases = [
  // Clear duplicates
  ['PIZZA LUCE', 'PIZZA LUCE 3200 Lyndale Ave S MINNEAPOLIS 55408 MN USA'],
  ['CUB FOODS', 'CUB FOODS #01693'],
  ['NETFLIX', 'NETFLIX.COM'],
  ['GOOGLE *ADS', 'GOOGLE *ADS2070699131'],

  // Partial matches (truncation)
  ['PROGRESSIVE *INSURANCE', 'PROGRESSIVE INSU CE'],
  ['NETFLIX ENTRETENIM', 'NETFLIX'],

  // Location variations
  ['UHG OPTUM CAFE', 'UHG OPTUM CAFE QPS'],
  ['HENNEPIN LAKE LIQUOR S', 'HENNEPIN LAKE LIQUOR S1200 WEST LAKE STREET'],

  // Not duplicates
  ['NETFLIX', 'SPOTIFY'],
  ['PIZZA LUCE', 'PIZZA RESTAURANT'],

  // Typos
  ['NETFLIX', 'NETFLOX'],
  ['DOORDASH', 'DOORDASSH']
]

console.log('1️⃣  INDIVIDUAL PAIR ANALYSIS\n')
console.log('Testing similarity scores for merchant pairs:\n')

testCases.forEach(([m1, m2], idx) => {
  const score = calculateSimilarityScore(m1, m2)
  const prediction = predictDuplicate(m1, m2, { threshold: 0.75, returnScore: true })

  console.log(`Case ${idx + 1}: "${m1}" vs "${m2}"`)
  console.log(`  Score: ${(score * 100).toFixed(1)}%`)
  console.log(`  Prediction: ${prediction.isDuplicate ? '✅ DUPLICATE' : '❌ NOT DUPLICATE'} (Confidence: ${prediction.confidence})`)
  console.log('')
})

console.log('\n2️⃣  DETAILED ALGORITHM BREAKDOWN\n')
console.log('Showing how each algorithm contributes to the decision:\n')

const examples = [
  ['NETFLIX', 'NETFLIX.COM', 'Different domains - should score high'],
  ['NETFLIX', 'NETFLOX', 'Typo - should score high'],
  ['NETFLIX', 'SPOTIFY', 'Different company - should score low']
]

examples.forEach(([m1, m2, description]) => {
  console.log(`✏️  ${description}`)
  console.log(`   "${m1}" vs "${m2}"\n`)

  const analysis = analyzeMatch(m1, m2)
  console.log(`  Individual Algorithm Scores:`)
  console.log(`  ├─ Jaro-Winkler:   ${(analysis.individualScores.jaroWinkler * 100).toFixed(1)}% (char position matching)`)
  console.log(`  ├─ Levenshtein:    ${(analysis.individualScores.levenshtein * 100).toFixed(1)}% (edit distance)`)
  console.log(`  ├─ Jaccard:        ${(analysis.individualScores.jaccard * 100).toFixed(1)}% (word overlap)`)
  console.log(`  ├─ Prefix:         ${(analysis.individualScores.prefix * 100).toFixed(1)}% (common start)`)
  console.log(`  └─ Length:         ${(analysis.individualScores.length * 100).toFixed(1)}% (length ratio)`)
  console.log(`\n  Combined Score: ${(analysis.combinedScore * 100).toFixed(1)}%`)
  console.log(`  Prediction: ${analysis.prediction}\n`)
})

console.log('\n3️⃣  BATCH DUPLICATE GROUP DETECTION\n')
console.log('Finding all duplicate groups in a merchant list:\n')

const merchants = [
  'NETFLIX',
  'NETFLIX.COM',
  'NETFLIX ENTRETENIM',
  'SPOTIFY',
  'GOOGLE *ADS',
  'GOOGLE *ADS2070699131',
  'PIZZA LUCE',
  'PIZZA LUCE 3200 Lyndale Ave S'
]

const groups = findDuplicateGroups(merchants, 0.70) // Lower threshold to catch more

console.log(`Merchants: ${merchants.join(', ')}\n`)
console.log(`Found ${groups.length} duplicate groups:\n`)

groups.forEach((group, idx) => {
  console.log(`Group ${idx + 1}: "${group.canonical}" (${group.count} variants)`)
  group.scores.forEach(item => {
    console.log(`  ├─ "${item.merchant}" (${(item.similarity * 100).toFixed(1)}% similar)`)
  })
  console.log('')
})

console.log('\n4️⃣  HOW THE ALGORITHMS WORK\n')

console.log('🔤 LEVENSHTEIN DISTANCE')
console.log('   Counts minimum edits to transform A to B')
console.log('   "NETFLIX" → "NETFLIX.COM": +4 chars = lower score\n')

console.log('🎯 JARO-WINKLER (Most Important!)')
console.log('   Matches characters by position, boosts matching prefixes')
console.log('   "NETFLIX" vs "NETFLIX.COM": Same start = HIGH score\n')

console.log('📚 JACCARD')
console.log('   Compares words as tokens')
console.log('   "PIZZA LUCE" vs "PIZZA LUCE 3200 LYNDALE": 2/4 words match\n')

console.log('👉 PREFIX')
console.log('   How much of the start matches')
console.log('   "PROGRESSIVE" vs "PROGRESSIVE INSU CE": All prefix matches\n')

console.log('📏 LENGTH')
console.log('   Merchants of similar length are more likely duplicates')
console.log('   Prevents matching "NETFLIX" with "SPOTIFY" just because they\'re both 7-8 chars\n')

console.log('========================================')
console.log('KEY LEARNING POINTS:')
console.log('========================================')
console.log('✅ Jaro-Winkler is best for business names')
console.log('✅ Combine multiple algorithms for robustness')
console.log('✅ Threshold 0.75 = high confidence duplicates')
console.log('✅ Threshold 0.60-0.75 = review manually')
console.log('✅ Threshold < 0.60 = probably different merchants')
console.log('========================================\n')
