# Transaction Deduplication Guide

## Overview

The FindMoney app uses a **two-tier deduplication strategy** to handle merchant name inconsistencies from PDF parsing:

### Tier 1: Automatic Address Stripping (Regex-Based)
Applied automatically during PDF upload and when using the merchant deduplication endpoint.

**What it catches:**
- Address contamination (streets, cities, ZIP codes)
- Phone numbers and large ID numbers
- Store numbers (with or without # prefix)
- International address indicators (RUA, AV, AVENIDA, etc.)
- Building/suite numbers

**Result:** Removes obvious address/ID contamination from merchant names

**Examples of automatic fixes:**
```
PIZZA LUCE 3200 Lyndale Ave S MINNEAPOLIS 55408 MN USA → PIZZA LUCE
CUB FOODS #01693 1104 LAGOON AVE MINNEAPOLIS → CUB FOODS
SLING.COM 9601 S MERIDIAN BLVD ENGLEWOOD CO 80112 → SLING.COM
SP INTELLIGENTSIA COFF1850 W. Fulton St. CHICAGO 60612 IL → SP INTELLIGENTSIA COFF
```

### Tier 2: Interactive Manual Deduplication (Modal-Based)
For cases where the same date+amount appears with different merchant names, allowing user to select which name is correct.

**What it catches:**
- Legitimate variations needing human judgment
- Different merchants vs. same merchant with variations
- Partial/truncated merchant names
- Regional or service-level variations

**How to use:**
1. Click "Deduplicate" button in Data Management section
2. Review all detected duplicate groups
3. For each group, select the canonical (correct) merchant name
4. Click "Apply Deduplication" to consolidate

## Current Status

**Database Statistics:**
- Total transactions: 339 (down from 394, removed 55 duplicates)
- Potential auto-dedup groups: 0 (all address contamination handled)
- Remaining manual review items: ~20 merchant variants

## Merchants Requiring Manual Review

These merchants have multiple variants that are likely duplicates but need confirmation:

### Clear Address Contamination (Already Fixed)
- ✅ PIZZA LUCE + address variants
- ✅ CUB FOODS + store numbers
- ✅ SLING.COM + full address
- ✅ SP INTELLIGENTSIA COFF + address
- ✅ SPEEDWAY + different store numbers

### Ambiguous Variants (Use Deduplication Modal)
These likely ARE the same merchant but have variations that our regex can't automatically detect:

| Core Name | Variants | Notes |
|-----------|----------|-------|
| **GOOGLE *ADS** | `GOOGLE *ADS`, `GOOGLE *ADS2070699131`, `GOOGLE *ADS2070699131 1600 AMPHITHEATRE...` | Store/Account ID concatenated; address included |
| **DD *DOORDASHMYBURGER** | `DD *DOORDASHMYBURGER`, `DD *DOORDASHMYBURGER 303 2ND STREET 8559731040...` | Address with phone number |
| **NETFLIX** | `NETFLIX`, `NETFLIX ENTRETENIM`, `NETFLIX.COM`, `NETFLIX.COM AV BERNARDINO...` | Different services/domains; may be legitimately separate |
| **PROGRESSIVE** | `PROGRESSIVE *INSURANCE`, `PROGRESSIVE INSU CE` | Truncated abbreviation |
| **UHG OPTUM CAFE** | `UHG OPTUM CAFE`, `UHG OPTUM CAFE QPS` | Location code concatenated |
| **HENNEPIN LAKE LIQUOR S** | `HENNEPIN LAKE LIQUOR S`, `HENNEPIN LAKE LIQUOR S1200 WEST LAKE...` | Store number concatenated; address included |

## When to Use Each Method

### Use Automatic Regex Deduplication:
- ✅ During PDF upload (automatic, no action needed)
- ✅ When you upload the same statement multiple times
- ✅ Whenever address patterns are detected

### Use Interactive Modal:
- 🔄 When there are multiple merchant name variations for same store
- 🔄 When date and amount match but names differ
- 🔄 When you need to review and approve the deduplication
- 🔄 When unsure if variations are truly duplicates

## Tips for Better Deduplication

1. **Before uploading:** Ensure PDFs have high quality scan/OCR
2. **During upload:** The AI will parse merchant names - variations are normal
3. **After upload:** Use the Deduplicate button to review and consolidate
4. **For ambiguous cases:** When unsure, select the most complete/professional-looking variant

## Regex Patterns Used

The normalization function uses these patterns (in order):

1. Store numbers: `#1234` or `1234 ` (space after)
2. Letter codes with numbers: ` QPS548`, ` SUBSCR548`, ` ADS2070699131`
3. Phone numbers: 7-10 consecutive digits
4. Building/Suite numbers: `1200 WEST` combined with address keywords
5. Street directions: `123 N. STREET`
6. ZIP codes: `55408`
7. City names: `MINNEAPOLIS`, `SAO PAULO`, etc.
8. State codes: `MN`, `CA`, etc.
9. International codes: `BRABRA`, `ISRISR`, etc.
10. Street indicators: `RUA`, `AV`, `AVENIDA` (Portuguese/Spanish)
11. Mail boxes: `PMB`, `PO BOX`
12. Long numbers: 8+ digits

## Future Improvements

- Add machine learning to predict likely duplicates
- Improve international address pattern detection
- Auto-merge high-confidence duplicates
- Track merchant name history for reporting
