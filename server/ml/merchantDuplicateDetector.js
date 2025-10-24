/**
 * Machine Learning Module for Merchant Duplicate Detection
 *
 * LEARNING GUIDE:
 * This module implements string similarity algorithms to detect likely duplicate merchants.
 * We use multiple algorithms and combine their scores for robust predictions.
 */

/**
 * ALGORITHM 1: Levenshtein Distance
 *
 * What it does: Counts minimum edits (insert, delete, replace) needed to transform string A to string B
 * Example: "NETFLIX" → "NETFLIX.COM" requires 4 insertions = distance of 4
 *
 * Score: 0 to 1 (1 = identical, 0 = completely different)
 * Learning: Good for catching typos and minor differences
 */
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0))

  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // insertion
        track[j - 1][i] + 1, // deletion
        track[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return track[str2.length][str1.length]
}

function levenshteinSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2)
  const maxLength = Math.max(str1.length, str2.length)
  return 1 - distance / maxLength
}

/**
 * ALGORITHM 2: Jaro-Winkler Similarity
 *
 * What it does: Measures similarity based on matching characters and their positions
 * Gives more weight to matching prefixes (better for business names)
 * Example: "NETFLIX" vs "NETFLIX.COM" scores high because they start the same
 *
 * Score: 0 to 1 (1 = identical, 0 = nothing in common)
 * Learning: Excellent for business names with variations
 */
function jaroSimilarity(str1, str2) {
  const s1Len = str1.length
  const s2Len = str2.length

  if (s1Len === 0 && s2Len === 0) return 1
  if (s1Len === 0 || s2Len === 0) return 0

  const matchDistance = Math.max(s1Len, s2Len) / 2 - 1
  const s1Matches = new Array(s1Len)
  const s2Matches = new Array(s2Len)

  let matches = 0
  let transpositions = 0

  // Find matches
  for (let i = 0; i < s1Len; i++) {
    const start = Math.max(0, i - matchDistance)
    const end = Math.min(i + matchDistance + 1, s2Len)

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || str1[i] !== str2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  // Find transpositions
  let k = 0
  for (let i = 0; i < s1Len; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (str1[i] !== str2[k]) transpositions++
    k++
  }

  return (matches / s1Len + matches / s2Len + (matches - transpositions / 2) / matches) / 3
}

function jaroWinklerSimilarity(str1, str2) {
  let jaro = jaroSimilarity(str1, str2)

  // If Jaro score is high, boost it for matching prefixes (up to 4 chars)
  if (jaro < 0.7) return jaro

  let prefix = 0
  for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
    if (str1[i] === str2[i]) {
      prefix++
    } else {
      break
    }
  }

  return jaro + prefix * 0.1 * (1 - jaro)
}

/**
 * ALGORITHM 3: Jaccard Similarity
 *
 * What it does: Compares word tokens (not characters)
 * Example: "PIZZA LUCE" vs "PIZZA LUCE 3200 LYNDALE AVE" = 2/5 words match = 0.4 similarity
 *
 * Score: 0 to 1 (based on word overlap)
 * Learning: Good for catching when one string is expanded version of another
 */
function jaccardSimilarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/))
  const words2 = new Set(str2.split(/\s+/))

  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}

/**
 * ALGORITHM 4: Prefix Overlap
 *
 * What it does: How much of the start of both strings match
 * Useful for catching truncated merchant names
 * Example: "PROGRESSIVE" vs "PROGRESSIVE *INSURANCE" both start with "PROGRESSIVE"
 *
 * Score: 0 to 1 (based on common prefix length)
 * Learning: Catches truncation patterns
 */
function prefixSimilarity(str1, str2) {
  const minLen = Math.min(str1.length, str2.length)
  let commonLen = 0

  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) {
      commonLen++
    } else {
      break
    }
  }

  return commonLen / Math.max(str1.length, str2.length)
}

/**
 * ALGORITHM 5: Length Similarity
 *
 * What it does: Merchants of similar length are more likely duplicates
 * Example: "NETFLIX" (7 chars) vs "NETFLIX.COM" (11 chars) = similar length
 *
 * Score: 0 to 1 (based on length ratio)
 * Learning: Helps filter out truly different merchants
 */
function lengthSimilarity(str1, str2) {
  const len1 = str1.length
  const len2 = str2.length
  const maxLen = Math.max(len1, len2)

  if (maxLen === 0) return 1

  const diff = Math.abs(len1 - len2)
  return 1 - diff / maxLen
}

/**
 * COMBINED SCORING FUNCTION
 *
 * Uses weighted average of all similarity metrics
 * Weights are tuned based on what works best for merchant names
 */
function calculateSimilarityScore(merchant1, merchant2) {
  // Normalize to uppercase for comparison
  const m1 = merchant1.toUpperCase().trim()
  const m2 = merchant2.toUpperCase().trim()

  if (m1 === m2) return 1.0 // Identical

  // Calculate individual scores
  const levenshteinScore = levenshteinSimilarity(m1, m2)
  const jaroWinklerScore = jaroWinklerSimilarity(m1, m2)
  const jaccardScore = jaccardSimilarity(m1, m2)
  const prefixScore = prefixSimilarity(m1, m2)
  const lengthScore = lengthSimilarity(m1, m2)

  // Weighted combination
  // Jaro-Winkler is most reliable for business names
  const combinedScore =
    jaroWinklerScore * 0.4 + // Most important for names
    levenshteinScore * 0.25 + // Character-level similarity
    jaccardScore * 0.15 + // Word-level similarity
    prefixScore * 0.1 + // Truncation patterns
    lengthScore * 0.1 // Length sanity check

  return combinedScore
}

/**
 * PREDICTION FUNCTION
 *
 * Determines if two merchants are likely duplicates
 * Uses threshold-based classification
 */
function predictDuplicate(merchant1, merchant2, options = {}) {
  const {
    threshold = 0.75, // Adjust this to be more/less aggressive
    returnScore = false // Return both prediction and score
  } = options

  const score = calculateSimilarityScore(merchant1, merchant2)
  const isDuplicate = score >= threshold

  if (returnScore) {
    return {
      isDuplicate,
      score: parseFloat(score.toFixed(3)),
      confidence: isDuplicate ? 'HIGH' : score > 0.6 ? 'MEDIUM' : 'LOW',
      threshold
    }
  }

  return isDuplicate
}

/**
 * BATCH PREDICTION FUNCTION
 *
 * Finds all likely duplicates in a group of merchants
 * Used in deduplication endpoint
 */
function findDuplicateGroups(merchants, threshold = 0.75) {
  const groups = []
  const used = new Set()

  for (let i = 0; i < merchants.length; i++) {
    if (used.has(i)) continue

    const group = [merchants[i]]
    used.add(i)

    // Find all merchants similar to this one
    for (let j = i + 1; j < merchants.length; j++) {
      if (used.has(j)) continue

      const prediction = predictDuplicate(merchants[i], merchants[j], { threshold, returnScore: true })
      if (prediction.isDuplicate) {
        group.push(merchants[j])
        used.add(j)
      }
    }

    // Only add to groups if we found duplicates
    if (group.length > 1) {
      groups.push({
        canonical: group[0], // Use first as representative
        variants: group,
        count: group.length,
        scores: group.map((m, idx) => ({
          merchant: m,
          similarity: idx === 0 ? 1.0 : calculateSimilarityScore(group[0], m)
        }))
      })
    }
  }

  return groups
}

/**
 * DETAILED ANALYSIS
 *
 * Shows exactly why two merchants are/aren't duplicates
 * Great for debugging and learning!
 */
function analyzeMatch(merchant1, merchant2) {
  const m1 = merchant1.toUpperCase().trim()
  const m2 = merchant2.toUpperCase().trim()

  const scores = {
    levenshtein: levenshteinSimilarity(m1, m2),
    jaroWinkler: jaroWinklerSimilarity(m1, m2),
    jaccard: jaccardSimilarity(m1, m2),
    prefix: prefixSimilarity(m1, m2),
    length: lengthSimilarity(m1, m2)
  }

  const combined = calculateSimilarityScore(merchant1, merchant2)

  return {
    merchant1,
    merchant2,
    individualScores: scores,
    combinedScore: parseFloat(combined.toFixed(3)),
    breakdown: {
      jaroWinkler: `${(scores.jaroWinkler * 100).toFixed(1)}% (40% weight)`,
      levenshtein: `${(scores.levenshtein * 100).toFixed(1)}% (25% weight)`,
      jaccard: `${(scores.jaccard * 100).toFixed(1)}% (15% weight)`,
      prefix: `${(scores.prefix * 100).toFixed(1)}% (10% weight)`,
      length: `${(scores.length * 100).toFixed(1)}% (10% weight)`
    },
    prediction: combined >= 0.75 ? 'LIKELY DUPLICATE' : combined >= 0.6 ? 'POSSIBLE DUPLICATE' : 'NOT A DUPLICATE'
  }
}

export {
  calculateSimilarityScore,
  predictDuplicate,
  findDuplicateGroups,
  analyzeMatch,
  levenshteinSimilarity,
  jaroWinklerSimilarity,
  jaccardSimilarity,
  prefixSimilarity,
  lengthSimilarity
}
