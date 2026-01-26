# Model Selection: JSON Schema Support

## Current Issue
`llama-3.3-70b-versatile` doesn't support `json_schema` mode with `generateObject()`, causing potential failures.

---

## Option 1: Switch to Llama 4 Scout (RECOMMENDED) ✅

### Model Details
- **Model ID:** `meta-llama/llama-4-scout-17b-16e-instruct`
- **Size:** 17B parameters (vs 70B current)
- **JSON Schema:** ✅ Fully supported
- **Speed:** Faster (smaller model)
- **Cost:** Lower (smaller model)

### Pros
- ✅ Native `json_schema` support (no parsing issues)
- ✅ Type-safe with `generateObject()`
- ✅ Faster inference (17B vs 70B)
- ✅ Lower API costs
- ✅ Works with existing code structure

### Cons
- ⚠️ Smaller model (17B) - might be less accurate at categorization
- ⚠️ Newer model - less proven than Llama 3.3

### Code Change
```typescript
// lib/ai/groq-client.ts
export const CATEGORIZATION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
```

**That's it!** No other changes needed. All `generateObject()` calls will work.

---

## Option 2: Keep Llama 3.3-70b with JSON Mode

### Model Details
- **Model ID:** `llama-3.3-70b-versatile`
- **Size:** 70B parameters
- **JSON Mode:** ✅ Supported (not json_schema)
- **Quality:** High (proven model)

### Pros
- ✅ Larger model = better categorization quality
- ✅ Proven track record
- ✅ More context understanding

### Cons
- ❌ No native `json_schema` support
- ❌ Requires manual parsing and validation
- ❌ More retry attempts needed
- ❌ Slower inference
- ❌ Higher API costs

### Code Changes Needed

**1. Update `lib/ai/categorize.ts`** - Replace `generateObject()` with `generateText()`:

```typescript
// Replace all generateObject calls with:
export async function categorizeExpense(
  description: string,
  amount: number
): Promise<AICategorizationResult> {
  try {
    const prompt = await getCategorizationPrompt(description, amount);
    const schema = await getCategorizationSchema();

    // Use generateText with JSON mode
    const { text } = await generateText({
      model: groq(CATEGORIZATION_MODEL),
      prompt: prompt + '\n\nRETURN ONLY VALID JSON, NO MARKDOWN.',
      temperature: 0.3,
    });

    // Parse and validate with retry logic
    const parseResult = await parseWithRetry(text, schema, retryPrompt, 3);

    if (!parseResult.success) {
      return fallbackResult;
    }

    return parseResult.data as any;
  } catch (error) {
    return fallbackResult;
  }
}
```

**2. Update batch categorization similarly**

---

## Comparison Matrix

| Feature | Llama 4 Scout | Llama 3.3-70b |
|---------|---------------|---------------|
| **JSON Schema** | ✅ Native | ❌ Manual |
| **Speed** | ⚡ Fast (17B) | 🐌 Slower (70B) |
| **Cost** | 💰 Lower | 💰💰 Higher |
| **Accuracy** | ⚠️ TBD (17B) | ✅ High (70B) |
| **Code Changes** | 1 line | ~50 lines |
| **Maintenance** | ✅ Simple | ⚠️ Complex |
| **Error Handling** | ✅ Built-in | ⚠️ Custom retry |

---

## Recommendation

### **Go with Option 1: Llama 4 Scout** 🎯

**Reasons:**
1. **Simplicity** - Change 1 line of code
2. **Reliability** - Native JSON schema = no parsing issues
3. **Performance** - Faster + cheaper
4. **Future-proof** - Llama 4 is newer architecture
5. **Your use case** - Expense categorization doesn't need 70B parameters

**When to reconsider:**
- If categorization accuracy drops significantly
- If you need complex reasoning beyond category selection
- If you want to add advanced features like spending insights

---

## Test Plan After Switching

If you choose Llama 4 Scout, test:

1. **Basic categorization:**
   - Import sample CSV
   - Verify categories are correct
   - Check confidence scores

2. **Brazilian context:**
   - Test installment detection
   - Verify Portuguese keywords work
   - Check recurring transaction detection

3. **Custom categories:**
   - Create custom category with hint
   - Import transactions matching hint
   - Verify AI uses custom category

4. **Batch processing:**
   - Import 50+ transactions
   - Verify all batches succeed
   - Check console logs for errors

---

## Rollback Plan

If Llama 4 Scout doesn't work well:

1. Revert model to `llama-3.3-70b-versatile`
2. Implement Option 2 (JSON mode with manual parsing)
3. Or try `llama-4-maverick-17b-128e-instruct` (alternative)

---

## Alternative Models to Consider

If Scout doesn't work:

1. **Llama 4 Maverick** (`meta-llama/llama-4-maverick-17b-128e-instruct`)
   - 128k context window
   - Same 17B size
   - JSON schema support

2. **Kimi K2 Instruct** (`moonshotai/kimi-k2-instruct-0905`)
   - JSON schema support
   - Different architecture
   - Worth testing

---

## Decision

**My recommendation: Start with Llama 4 Scout (Option 1)** ✅

It's the path of least resistance, maintains code quality, and you can always fall back to Option 2 if needed.

Would you like me to implement Option 1 (change 1 line) or Option 2 (refactor to JSON mode)?
