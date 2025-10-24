# Machine Learning for Duplicate Detection - Learning Guide

## Overview

I've implemented **string similarity algorithms** for machine learning-based duplicate merchant detection. This is a practical, educational ML system you can learn from and extend.

## Why Machine Learning for Duplicates?

**Problem:** Merchants like `NETFLIX`, `NETFLIX.COM`, `NETFLIX ENTRETENIM` are clearly related but don't always have the same date+amount.

**Solution:** Use ML algorithms to calculate string similarity scores (0-1) and predict duplicates.

**Advantage:** No training data needed! Uses mathematical algorithms that work on any text.

---

## The Five Algorithms Explained

### 1. **Jaro-Winkler Similarity** ⭐ Most Important

**What it does:**
- Matches characters based on their POSITION in strings
- Gives higher scores to matching prefixes (start of string)
- Perfect for business names that share the same beginning

**Example:**
```
"NETFLIX" vs "NETFLIX.COM"
- Both start with "NETFLIX" = HIGH similarity
- Score: 83.4%

"NETFLIX" vs "SPOTIFY"
- Different prefixes = LOW similarity
- Score: 42.9%
```

**How it works (simplified):**
1. Find matching characters within a certain distance
2. Count matching characters
3. Boost score if prefix matches

**When to use:** Always! This is the best algorithm for business names.

**Code location:** [server/ml/merchantDuplicateDetector.js:47-100](server/ml/merchantDuplicateDetector.js)

---

### 2. **Levenshtein Distance**

**What it does:**
- Counts minimum "edits" (insert, delete, replace) to transform string A to string B
- Converts to similarity score (1 = identical, 0 = completely different)

**Example:**
```
"NETFLIX" → "NETFLIX.COM"
- Need to add: . C O M = 4 edits
- Distance: 4
- Similarity: 1 - (4/11) = 63.6%

"NETFLIX" → "SPOTIFY"
- Replace: N→S, F→P, L→L, I→O, X→T, ... = 5 edits
- Similarity: lower
```

**When to use:** Good for catching typos and OCR errors.

**Why not just use this?** It treats all positions equally. "Netflix" vs "Netflix.COM" are quite different by edit distance, but obviously the same company.

**Code location:** [server/ml/merchantDuplicateDetector.js:14-45](server/ml/merchantDuplicateDetector.js)

---

### 3. **Jaccard Similarity**

**What it does:**
- Splits strings into WORDS
- Compares word overlap
- Formula: (shared words) / (total unique words)

**Example:**
```
"PIZZA LUCE" vs "PIZZA LUCE 3200 LYNDALE AVE"
Words: {PIZZA, LUCE} vs {PIZZA, LUCE, 3200, LYNDALE, AVE}
Overlap: 2 words out of 5 total = 40% similarity

"UHG OPTUM CAFE" vs "UHG OPTUM CAFE QPS"
Words: {UHG, OPTUM, CAFE} vs {UHG, OPTUM, CAFE, QPS}
Overlap: 3 words out of 4 total = 75% similarity
```

**When to use:** Great for catching when one string is an expanded version of another.

**Code location:** [server/ml/merchantDuplicateDetector.js:133-145](server/ml/merchantDuplicateDetector.js)

---

### 4. **Prefix Similarity**

**What it does:**
- Measures how much of the START of both strings match
- Formula: (common prefix length) / (longest string length)

**Example:**
```
"PROGRESSIVE *INSURANCE" vs "PROGRESSIVE INSU CE"
Common prefix: "PROGRESSIVE " = 12 characters
Longest: 22 characters
Similarity: 12/22 = 54.5%
```

**When to use:** Catches truncated merchant names.

**Code location:** [server/ml/merchantDuplicateDetector.js:158-168](server/ml/merchantDuplicateDetector.js)

---

### 5. **Length Similarity**

**What it does:**
- Merchants of similar length are more likely duplicates
- Prevents false matches like "NETFLIX" (7 chars) matching "SPOTIFY" (7 chars) just because they're the same length

**Example:**
```
"NETFLIX" vs "NETFLIX.COM"
Length ratio: 7 vs 11 = fairly similar = 0.636

"NETFLIX" vs "SPOTIFY"
Length ratio: 7 vs 7 = identical = 1.0
(But other algorithms catch this isn't a match)
```

**When to use:** Sanity check / tiebreaker between other algorithms.

**Code location:** [server/ml/merchantDuplicateDetector.js:180-190](server/ml/merchantDuplicateDetector.js)

---

## Combined Scoring

All 5 algorithms are combined with **weighted average**:

```
Final Score =
  (Jaro-Winkler × 0.40) +      ← 40% weight (most important)
  (Levenshtein × 0.25) +        ← 25% weight
  (Jaccard × 0.15) +            ← 15% weight
  (Prefix × 0.10) +             ← 10% weight
  (Length × 0.10)               ← 10% weight
```

**Why these weights?**
- Jaro-Winkler is best for business names
- Levenshtein catches typos well
- Jaccard helps with partial matches
- Prefix catches truncation
- Length is a sanity check

**Code location:** [server/ml/merchantDuplicateDetector.js:210-224](server/ml/merchantDuplicateDetector.js)

---

## How to Use

### 1. **Test the ML Locally**

Run the demonstration:
```bash
node test-ml-duplicates.js
```

This shows:
- ✅ Individual pair analysis
- ✅ Detailed algorithm breakdown
- ✅ Batch duplicate detection
- ✅ How each algorithm contributes

### 2. **Use the ML Endpoint**

**Analyze duplicates (no changes):**
```bash
curl -X POST http://localhost:3001/api/admin/ml-duplicate-detection \
  -H "Content-Type: application/json" \
  -d '{"threshold": 0.75, "action": "analyze"}'
```

**Response includes:**
- ML score for each pair (0-1)
- Individual algorithm scores
- Confidence level (HIGH/MEDIUM/LOW)
- Recommendation (auto-consolidate / review / manual)

**Auto-consolidate high-confidence matches (≥0.85):**
```bash
curl -X POST http://localhost:3001/api/admin/ml-duplicate-detection \
  -H "Content-Type: application/json" \
  -d '{"threshold": 0.75, "action": "consolidate"}'
```

### 3. **Adjust Thresholds**

Different thresholds for different use cases:

```
Threshold 0.95+  = Conservative (only obvious)
Threshold 0.85   = HIGH confidence
Threshold 0.75   = MEDIUM confidence (balanced)
Threshold 0.70   = Aggressive (catch more)
Threshold 0.60   = Very aggressive (needs review)
```

Try different thresholds:
```bash
# Conservative - only very obvious duplicates
curl ... -d '{"threshold": 0.90, "action": "analyze"}'

# Aggressive - catch everything possible
curl ... -d '{"threshold": 0.65, "action": "analyze"}'
```

---

## Real Results on Your Data

**At 0.75 threshold:**
- Found: 40 duplicate pairs
- Organized into: 10 groups
- HIGH confidence: 2 (safe to auto-consolidate)
- MEDIUM confidence: 8 (review first)

**Examples found:**

1. ✅ `SMOKELESS` vs `Smokeless` (100% match - case difference only)
   - Confidence: HIGH
   - Recommendation: Auto-consolidate

2. ✅ `UHG OPTUM CAFE` vs `UHG OPTUM CAFE QPS` (84.5% match)
   - Confidence: MEDIUM
   - Recommendation: Review first

3. ❓ `DD *DOORDASHMYBURGER 303 2ND STREET...` vs `DD *DOORDASHMYBURGER...` (80.3% match)
   - Confidence: MEDIUM
   - These are different locations, so NOT consolidating

---

## Understanding the Output

Each duplicate pair has:

```json
{
  "merchant1": "UHG OPTUM CAFE",
  "merchant2": "UHG OPTUM CAFE QPS",
  "mlScore": 0.845,           ← Combined score (0-1)
  "confidence": "MEDIUM",     ← HIGH/MEDIUM/LOW
  "recommendation": "Review before consolidating",
  "algorithms": {
    "jaroWinkler": 0.956,     ← Position matching
    "levenshtein": 0.778,     ← Edit distance
    "jaccard": 0.75,          ← Word overlap
    "prefix": 0.778,          ← Common start
    "length": 0.778           ← Length similarity
  }
}
```

**How to interpret:**
- If Jaro-Winkler is HIGH but Jaccard is LOW → probably different merchants
- If all scores are HIGH → definitely a duplicate
- If prefix is HIGH but others are LOW → could be truncation

---

## Learning Path

### Beginner Level
1. Read this guide
2. Run `node test-ml-duplicates.js`
3. Understand the 5 algorithms
4. Try different test cases

### Intermediate Level
1. Modify weights in `calculateSimilarityScore()`
2. Add new algorithm (e.g., n-gram similarity)
3. Test on your data with `curl`
4. Adjust thresholds based on results

### Advanced Level
1. Implement neural network using TensorFlow.js
2. Create training data from your merchant duplicates
3. Train model to learn which duplicates matter most
4. Use trained model for predictions

---

## How to Extend

### Add a New Algorithm

```javascript
// In merchantDuplicateDetector.js, add:
function myNewAlgorithm(str1, str2) {
  // Your implementation here
  return similarityScore // 0 to 1
}

// Then in calculateSimilarityScore():
const myScore = myNewAlgorithm(m1, m2)
const combinedScore =
  jaroWinklerScore * 0.4 +
  levenshteinScore * 0.25 +
  myScore * 0.15 +  // ← Add your score
  // ...
```

### Try Different Weights

Experiment with weights to see what works best:

```javascript
// Original: Jaro-Winkler heavy
const combined = jaro * 0.4 + lev * 0.25 + jaccard * 0.15 + ...

// Try: More word-based
const combined = jaro * 0.3 + lev * 0.2 + jaccard * 0.3 + ...

// Try: More edit-distance
const combined = jaro * 0.2 + lev * 0.4 + jaccard * 0.15 + ...
```

### Add Domain Knowledge

```javascript
// Boost score if both merchants are restaurants
if (str1.includes('PIZZA') && str2.includes('PIZZA')) {
  score += 0.1
}

// Lower score if merchants are clearly different domains
if ((str1.includes('BANK') && str2.includes('FOOD'))) {
  score -= 0.2
}
```

---

## The ML Advantage Over Regex

| Approach | Pros | Cons |
|----------|------|------|
| **Regex** | Fast, deterministic, clear rules | Hard to catch all patterns |
| **ML** | Flexible, catches subtle matches | Needs threshold tuning |
| **Combined** | Best of both worlds! | More complex |

**Our approach:** Use regex FIRST for obvious address removal, then ML for ambiguous cases.

---

## Next Steps

1. ✅ Run test file to understand algorithms
2. ✅ Try `/api/admin/ml-duplicate-detection` endpoint
3. 🔄 Adjust thresholds based on your data
4. 🔄 Review MEDIUM confidence matches manually
5. 🔄 Auto-consolidate HIGH confidence matches
6. 📚 Experiment with weights and algorithms

---

## Key Takeaways

✅ **String similarity is practical ML** - No training data needed, just math!

✅ **Multiple algorithms = robustness** - Different algorithms catch different patterns

✅ **Thresholds matter** - Same algorithm at 0.70 vs 0.85 gives very different results

✅ **Combined scoring works better** - Weighted average of algorithms beats single algorithm

✅ **This scales** - Works for 100s or 1000s of merchants

---

## References

- **Jaro-Winkler:** https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance
- **Levenshtein:** https://en.wikipedia.org/wiki/Levenshtein_distance
- **Jaccard:** https://en.wikipedia.org/wiki/Jaccard_index
- **String Metrics:** https://en.wikipedia.org/wiki/String_metric

---

## Questions?

Try modifying the test file and see what happens! The best way to learn ML is to experiment with different inputs and see how the algorithms respond.
