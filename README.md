# FindMoney - Personal Spending Analysis

A full-stack React application for analyzing and categorizing personal spending transactions with a SQLite backend.

## Features

- 📊 Visual spending analysis with interactive charts
- 🏷️ Smart transaction categorization with merchant rules
- 🧹 **Dual-mode transaction deduplication:**
  - **Regex-based**: Removes address contamination and standardizes merchant names
  - **ML-based**: Uses 5 string similarity algorithms (Jaro-Winkler, Levenshtein, Jaccard, Prefix, Length) to detect subtle duplicates
- 📁 Data export functionality
- 📄 PDF statement processing with AI-powered merchant extraction
- 📱 Responsive design with Tailwind CSS
- 🔥 Hot module replacement for rapid development
- 🧠 Machine learning duplicate detection with adjustable confidence thresholds

## Architecture

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons

**Backend:**
- Express.js server (Node.js)
- SQLite database with better-sqlite3
- RESTful API architecture
- Auto-reloading with nodemon

## Data Deduplication

FindMoney uses a two-tier deduplication strategy to handle both obvious and subtle duplicate merchants:

### Regex-Based Deduplication

Automatically removes address contamination and standardizes merchant names using pattern matching:

- **Address removal**: Strips street addresses, cities, states, zip codes
- **Phone number removal**: Removes merchant contact numbers
- **Store number normalization**: Handles variations like `#01693` and `46374`
- **Email and URL stripping**: Removes online identifiers
- **Whitespace normalization**: Consolidates multiple spaces

**Example:**
- Input: `CUB FOODS #01693 1104 LAGOON AVE MINNEAPOLIS 55408 MN USA`
- Output: `CUB FOODS`

**Usage in UI:**
1. Click "Deduplicate" button in Data Management
2. Review flagged duplicate groups with their transactions
3. Select canonical merchant name for each group
4. Click "Apply Deduplication"

### ML-Based Deduplication

Machine learning algorithms detect subtle duplicates that regex patterns miss. Uses 5 complementary string similarity algorithms with weighted scoring:

| Algorithm | Purpose | Weight |
|-----------|---------|--------|
| **Jaro-Winkler** | Position-based character matching with prefix boost | 40% |
| **Levenshtein** | Edit distance (insertions/deletions/replacements) | 25% |
| **Jaccard** | Word-level token overlap | 15% |
| **Prefix** | Common starting characters | 10% |
| **Length** | Length ratio similarity | 10% |

**Confidence Levels:**
- **HIGH (≥85%)**: Safe to auto-consolidate, very likely duplicates
- **MEDIUM (75-85%)**: Review recommended, probable duplicates
- **LOW (<75%)**: Manual review needed, possible false positives

**Usage in UI:**
1. Click "ML Dedup" button in Data Management
2. Adjust confidence threshold slider (0.50-0.95):
   - **0.95** = Conservative (only obvious matches)
   - **0.75** = Balanced (recommended)
   - **0.50** = Aggressive (catch more, requires review)
3. Click "Analyze" to find duplicates at current threshold
4. **Option A - Manual Selection:**
   - Check individual pairs you want to consolidate
   - Select which merchant name to keep from dropdown
   - Click "Consolidate Selected (N)"
5. **Option B - Auto-Consolidate:**
   - Click "Auto-Consolidate HIGH Confidence" to merge all ≥85% matches

**Example ML Detection:**
```
Pair: "NETFLIX" vs "NETFLIX.COM"
  - Jaro-Winkler: 82.4%
  - Levenshtein: 88.9%
  - Jaccard: 50.0%
  - Prefix: 88.9%
  - Length: 100%
  → Combined Score: 84.5% (MEDIUM confidence)
  → Recommendation: Review before consolidating
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

**Run with hot reloading (recommended):**
```bash
npm run dev:fullstack
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend dev server on `http://localhost:3000` (with HMR)
- API requests automatically proxied from frontend to backend

Access the app at: [http://localhost:3000](http://localhost:3000)

**Run separately:**
```bash
# Terminal 1 - Backend with auto-reload
npm run dev:backend

# Terminal 2 - Frontend with HMR
npm run dev
```

### Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run server
   ```

The server will serve the built frontend and API from port 3001.

## Available Scripts

- `npm run dev:fullstack` - Run both frontend (HMR) and backend (auto-reload)
- `npm run dev` - Start Vite dev server only (port 3000)
- `npm run dev:backend` - Start backend with nodemon (port 3001)
- `npm run server` - Start production server
- `npm run build` - Build frontend for production
- `npm run build:fullstack` - Build and start production server
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

### Transaction Management
- `GET /api/transactions` - Get all transactions
- `PUT /api/transactions/category/bulk` - Update category for all transactions from a merchant

### Analysis & Summary
- `GET /api/categories` - Get all categories
- `GET /api/categories/summary` - Get category spending summary

### Statements
- `GET /api/statements` - Get all uploaded statements
- `POST /api/pdf-upload` - Upload and process PDF bank statement

### Merchant Rules
- `GET /api/merchant-rules` - Get merchant categorization rules
- `POST /api/merchant-rules` - Create/update merchant rule
- `GET /api/merchant-rules/export` - Export categorization rules

### Deduplication (Admin)
- `POST /api/admin/deduplicate-transactions` - Regex-based deduplication (analyze & fix modes)
- `POST /api/admin/ml-duplicate-detection` - ML-based duplicate detection (analyze & consolidate modes)
- `POST /api/admin/ml-duplicate-consolidate` - Manually consolidate selected ML-detected pairs

### Health & Utility
- `GET /api/health` - Health check endpoint

## Project Structure

```
findMoney/
├── src/
│   ├── components/
│   │   ├── DeduplicationModal.tsx          # Regex-based deduplication UI
│   │   ├── MLDeduplicationModal.tsx        # ML-based deduplication UI
│   │   ├── DataManagement.tsx              # PDF upload & deduplication launcher
│   │   └── ...
│   ├── types/                              # TypeScript type definitions
│   └── main.tsx
├── server/
│   ├── routes/
│   │   ├── admin.js                        # Admin endpoints (deduplication)
│   │   └── ...
│   ├── ml/
│   │   └── merchantDuplicateDetector.js    # ML algorithms module
│   ├── db/
│   │   └── database.js                     # SQLite setup
│   └── server.js                           # Express app
└── README.md
```

### Key Modules

**ML Duplicate Detection** (`server/ml/merchantDuplicateDetector.js`):
- `levenshteinDistance()` - Calculates edit distance between strings
- `jaroSimilarity()` - Jaro algorithm implementation
- `jaroWinklerSimilarity()` - Jaro with prefix weighting
- `jaccardSimilarity()` - Token overlap calculation
- `prefixSimilarity()` - Common prefix length
- `lengthSimilarity()` - Length ratio comparison
- `calculateSimilarityScore()` - Weighted combination of all algorithms
- `predictDuplicate()` - Binary classification with threshold
- `findDuplicateGroups()` - Batch duplicate detection
- `analyzeMatch()` - Detailed breakdown of match scores

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

**Backend:**
- Express.js
- SQLite (better-sqlite3)
- Node.js
- dotenv for configuration
- CORS enabled
- Multer for file upload handling
- pdfjs-dist for PDF parsing
- Anthropic Claude API for AI merchant extraction (optional)

## Learning Resources

### Machine Learning in FindMoney

FindMoney includes a practical ML learning experience through the duplicate detection system. The implementation demonstrates:

1. **Algorithm Selection**: Why different algorithms are needed
   - Jaro-Winkler for positional matching
   - Levenshtein for edit distance
   - Jaccard for word-level overlap
   - Prefix for common starts
   - Length for size similarity

2. **Weighting & Scoring**: Combining multiple signals into a single confidence score

3. **Threshold-Based Classification**: Converting continuous scores into actionable categories (HIGH/MEDIUM/LOW)

4. **Batch Processing**: Scaling algorithms across 100+ merchants efficiently

For detailed explanations of each algorithm and testing, see:
- `ML_LEARNING_GUIDE.md` - Comprehensive algorithm guide
- `DEDUPLICATION_GUIDE.md` - Two-tier strategy overview
- `test-ml-duplicates.js` - Runnable examples: `node test-ml-duplicates.js`

## Workflow Examples

### Scenario 1: Address Contamination
**Problem:** Same merchant appears multiple times with different addresses
```
CUB FOODS #01693 1104 LAGOON AVE MINNEAPOLIS 55408 MN USA (3 txns)
CUB FOODS #02104 MAIN STREET ST PAUL 55102 MN USA (2 txns)
```

**Solution:** Use Regex Deduplication
1. Click "Deduplicate"
2. Both will normalize to "CUB FOODS"
3. System groups 5 transactions under one canonical merchant

### Scenario 2: Subtle Name Variations
**Problem:** Same merchant with spelling variations or abbreviations
```
NETFLIX (2 txns)
NETFLIX.COM (1 txn)
NETFLX (1 txn, typo)
```

**Solution:** Use ML Deduplication
1. Click "ML Dedup"
2. Set threshold to 0.75 (Balanced)
3. Click "Analyze"
4. ML detects 2 pairs with 84-92% similarity
5. Option A: Manually select HIGH confidence pairs and consolidate
6. Option B: Click "Auto-Consolidate HIGH Confidence" to merge all ≥85% matches

## Performance & Results

Tested on real transaction data:
- **Transaction Volume**: 394 transactions analyzed
- **Merchants Analyzed**: 177 unique merchants
- **Duplicates Found**:
  - Regex: 17 duplicate groups (55+ transactions removed)
  - ML: 7 potential duplicate pairs (detected at 0.75 threshold)
- **Accuracy**: Manual review confirmed all HIGH confidence matches as true duplicates

## Troubleshooting

### No duplicates found
- Try lowering the ML threshold (more aggressive search)
- Regex catches obvious cases first, ML catches subtle ones
- Not all merchant variations are duplicates (intentional differences)

### False positives in ML results
- Review MEDIUM confidence pairs before consolidating
- Use manual selection instead of auto-consolidate for safety
- Check algorithm scores to understand why pair was flagged

### Duplicate IDs after consolidation
- System regenerates transaction IDs based on canonical merchant
- UNIQUE constraint violations are handled by removing the duplicate
- Data is cleaned automatically during consolidation

## Future Enhancements

- [ ] Interactive algorithm weight adjustment
- [ ] Custom regex pattern builder UI
- [ ] ML model fine-tuning based on user feedback
- [ ] Batch duplicate rules (e.g., "always consolidate DD *DOORDASH variants")
- [ ] Undo/rollback for consolidation operations
- [ ] Export deduplication audit log
