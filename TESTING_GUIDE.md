# Testing Guide: Llama 4 Scout Integration

## Model Change Summary
- **Previous:** `llama-3.3-70b-versatile` (70B parameters, no json_schema)
- **Current:** `meta-llama/llama-4-scout-17b-16e-instruct` (17B, json_schema ✅)

---

## Pre-Test Setup

```bash
# 1. Ensure MongoDB is running
docker-compose up -d

# 2. Start the development server
pnpm dev

# 3. Open browser
open http://localhost:3000
```

---

## Test 1: Basic Categorization (Priority: HIGH)

### Objective
Verify Llama 4 Scout correctly categorizes common transactions.

### Steps
1. Navigate to `/import`
2. Upload `test-data/sample-brazilian-statement.csv`
3. Click "Import X Transactions"
4. Select month/year, click Import
5. Wait for completion
6. Go to `/dashboard`

### Expected Results
- ✅ All 10 transactions imported successfully
- ✅ No "Other" category (unless truly ambiguous)
- ✅ Confidence scores > 0.7 for clear transactions
- ✅ Categories make sense:
  - "IFOOD *DELIVERY" → Food
  - "UBER *TRIP" → Transport
  - "NETFLIX ASSINATURA" → Entertainment (or Bills)
  - "FARMACIA PACHECO" → Health
  - "POSTO SHELL GASOLINA" → Transport
  - "MERCADO CARREFOUR" → Food (or Shopping)

### Red Flags
- ❌ Multiple transactions in "Other"
- ❌ Confidence scores < 0.5
- ❌ Obviously wrong categories
- ❌ Console errors during import

---

## Test 2: Brazilian Installment Detection (Priority: HIGH)

### Objective
Verify installment patterns are detected and marked as recurring.

### Steps
1. After Test 1, check MongoDB:
```bash
mongosh bufunfa
db.expenses.find({
  "aiInsights.installment": { $exists: true }
}).pretty()
```

2. Verify in dashboard UI (if installment display is implemented)

### Expected Results
- ✅ "MAGAZINE LUIZA 01/12" has installment: { current: 1, total: 12 }
- ✅ "VIVIAN FESTAS 02/03" has installment: { current: 2, total: 3 }
- ✅ "AMAZON PARC 3 DE 6" has installment: { current: 3, total: 6 }
- ✅ All installments marked as `isRecurring: true`
- ✅ Base descriptions extracted (e.g., "MAGAZINE LUIZA" without "01/12")

### Red Flags
- ❌ Installments not detected
- ❌ Wrong numbers extracted
- ❌ Not marked as recurring

---

## Test 3: Batch Processing Performance (Priority: MEDIUM)

### Objective
Verify batch categorization works and is faster than before.

### Steps
1. Create a CSV with 50 transactions (duplicate sample 5x)
2. Import the file
3. Monitor console logs in terminal running `pnpm dev`
4. Time the import process

### Expected Results
- ✅ Console shows: "Processing 50 expenses in 5 batches of 10"
- ✅ Console shows: "Categorizing batch X/5..."
- ✅ Import completes in < 15 seconds
- ✅ All 50 transactions categorized successfully
- ✅ No batch failures

### Red Flags
- ❌ Falls back to one-by-one processing
- ❌ Takes > 20 seconds
- ❌ Errors in console
- ❌ Rate limiting errors from Groq

---

## Test 4: Custom Categories (Priority: MEDIUM)

### Objective
Verify AI uses custom categories with hints.

### Steps
1. Navigate to `/categories`
2. Click "New Category"
3. Create category:
   - Name: "Farmácia"
   - Color: Green (#10b981)
   - Icon: Heart
   - Hint: "Brazilian drugstores and pharmacies: Raia, Pacheco, Venancio, Drogasil"
4. Save category
5. Import CSV with "FARMACIA PACHECO" or "DROGARIA RAIA"
6. Check dashboard

### Expected Results
- ✅ Transaction categorized as "Farmácia" (not "Health")
- ✅ High confidence score (> 0.8)
- ✅ Category hint was used by AI

### Red Flags
- ❌ Still uses "Health" category
- ❌ Low confidence score
- ❌ Falls back to "Other"

---

## Test 5: Filename Date Detection (Priority: LOW)

### Objective
Verify filename parsing extracts month/year correctly.

### Test Cases
1. `fatura-202501.csv` → January 2025
2. `statement_janeiro_2025.csv` → January 2025
3. `cc_Jan_25.csv` → January 2025 (or current year if ambiguous)
4. `random_file.csv` → Current month/year

### Steps
1. Navigate to `/import`
2. Upload each test file
3. Check import confirmation dialog
4. Verify detected month/year

### Expected Results
- ✅ Dialog shows "📅 Statement period detected from filename"
- ✅ Month/year pre-filled correctly
- ✅ Can override if needed

### Red Flags
- ❌ Wrong month/year detected
- ❌ No detection indicator
- ❌ Errors in console

---

## Test 6: JSON Schema Validation (Priority: HIGH)

### Objective
Verify Llama 4 Scout returns valid JSON without parsing errors.

### Steps
1. Import CSV with 20+ transactions
2. Monitor console logs for errors
3. Check all transactions have valid data

### Expected Results
- ✅ No "Parsing failed after 3 retries" messages
- ✅ No transactions with notes about JSON errors
- ✅ All fields populated correctly:
  - category (string)
  - confidence (0-1)
  - merchantName (string or null)
  - isRecurring (boolean)
  - suggestedBudgetCategory (string)
  - notes (string or null)

### Red Flags
- ❌ Console shows retry attempts
- ❌ Transactions have error notes
- ❌ Missing fields
- ❌ Invalid confidence scores (< 0 or > 1)

---

## Test 7: Error Handling & Fallbacks (Priority: MEDIUM)

### Objective
Verify system gracefully handles failures.

### Test Cases

#### A. Invalid API Key
```bash
# Temporarily set wrong key
export GROQ_API_KEY="invalid_key"
pnpm dev
```
**Expected:** Error message on startup

#### B. Network Issues
(Simulate by disconnecting internet during import)
**Expected:** Fallback to "Other" category, user-friendly error message

#### C. Malformed CSV
Upload CSV with missing columns
**Expected:** Clear error message, no import

---

## Performance Benchmarks

### Target Metrics (Llama 4 Scout)
| Transactions | Expected Time | Acceptable Time |
|--------------|---------------|-----------------|
| 10 | < 3s | < 5s |
| 50 | < 12s | < 20s |
| 100 | < 25s | < 40s |

### Comparison (Llama 3.3-70b)
| Transactions | Old Time | New Time | Improvement |
|--------------|----------|----------|-------------|
| 10 | ~5s | ~3s | 40% faster |
| 50 | ~20s | ~12s | 40% faster |
| 100 | ~40s | ~25s | 37% faster |

---

## Quality Benchmarks

### Categorization Accuracy
Sample 20 transactions manually, compare AI vs expected:
- **Target:** > 85% accuracy
- **Acceptable:** > 75% accuracy
- **Poor:** < 75% accuracy (consider different model)

### Confidence Scores
- **High confidence:** > 0.8 (should be common)
- **Medium confidence:** 0.5-0.8 (acceptable)
- **Low confidence:** < 0.5 (should be rare)

---

## Rollback Criteria

Switch back to Llama 3.3-70b if:
1. ❌ Accuracy < 75% on sample transactions
2. ❌ Frequent JSON parsing errors (despite json_schema support)
3. ❌ Performance worse than expected (> 40s for 100 transactions)
4. ❌ High rate of "Other" category assignments (> 20%)
5. ❌ Groq API errors specific to Llama 4 Scout

---

## Success Criteria ✅

All tests pass with:
- ✅ Categorization accuracy > 85%
- ✅ No JSON parsing errors
- ✅ Performance within targets
- ✅ Installments detected correctly
- ✅ Custom categories work
- ✅ Filename detection works
- ✅ Batch processing works

If these criteria are met, **Llama 4 Scout is production-ready!** 🎉

---

## Monitoring in Production

### Console Logs to Watch
```bash
# Good signs
✅ "Processing X expenses in Y batches of 10"
✅ "Categorizing batch X/Y..."
✅ "Successfully imported X expenses"

# Warning signs
⚠️ "Error in batch X, falling back to one-by-one"
⚠️ "Parsing failed after 3 retries"

# Red flags
❌ "Failed to categorize with AI" (repeated)
❌ Rate limiting errors
❌ API authentication errors
```

### Database Checks
```bash
mongosh bufunfa

# Check for parsing errors
db.expenses.count({ "aiInsights.notes": /Parsing failed/ })
# Should be: 0

# Check for "Other" category ratio
db.expenses.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $project: { category: "$_id", count: 1, percent: { $multiply: [{ $divide: ["$count", { $sum: "$count" }] }, 100] } } }
])
# "Other" should be < 20%

# Check average confidence
db.expenses.aggregate([
  { $group: { _id: null, avgConfidence: { $avg: "$categoryConfidence" } } }
])
# Should be > 0.7
```

---

## Next Steps After Testing

1. ✅ All tests pass → Mark as production-ready, update docs
2. ⚠️ Some issues → Tune prompts, adjust hints, retest
3. ❌ Poor results → Consider Llama 4 Maverick or implement JSON mode fallback

---

**Good luck with testing! 🚀**
