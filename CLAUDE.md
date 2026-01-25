# Bufunfa - AI-Optimized Guidelines

> **Token Optimization Notice**
> This doc uses abbreviations & symbols for AI efficiency. When updating:
> - Use symbols: → (becomes), ✓ (required), × (avoid), ∴ (therefore)
> - Use abbrev: SC (Server Component), CA (Client Component), SA (Server Action), DB (Database), TS (TypeScript)
> - Keep format compact, no fluff
> - Preserve all critical patterns & standards

---

## Stack
Next.js 16 (App Router) • TS (strict) • MongoDB 8.0 • Groq AI (Llama 4 Scout) • shadcn/ui • Tailwind • PapaParse

Privacy-first expense manager: self-hosted, no auth, no telemetry, AI categorization via Groq only

---

## Code Standards

### TypeScript
- ✓ Strict mode, explicit return types
- ✓ `interface` for objects, `type` for unions
- × Never `any` (use `unknown` if needed)

### React Patterns
- ✓ SC by default, CA only when needed (interactivity, hooks, browser APIs)
- ✓ Wrap async SC in `<Suspense>` + loading skeleton
- ✓ SA files start with `'use server'`
- ✓ Try-catch in all SA, return `{ success: boolean; error?: string }`
- × No prop drilling, fetch data where needed

### File Naming
- Components: `kebab-case.tsx`
- Actions: `kebab-case.ts` in `/lib/actions/`
- Types: `kebab-case.ts` in `/lib/types/`
- Constants: `ALL_CAPS`

### Styling
- ✓ Tailwind only (except `globals.css`)
- ✓ shadcn/ui components
- ✓ Mobile-first, dark mode support
- ✓ Spacing scale: 4, 6, 8

---

## DB Schema

### Expenses
```ts
{
  _id: ObjectId,
  description: string,
  amount: number,
  date: Date,
  categoryId: string,      // ObjectId ref → categories
  subcategoryId: string,   // ObjectId ref → subcategory in category
  categoryConfidence: number,
  merchantName: string | null,
  statementMonth: number,
  statementYear: number,
  rawCsvRow: string,
  createdAt: Date,
  updatedAt: Date,
  aiInsights: {
    isRecurring: boolean,
    suggestedBudgetCategory: string,
    notes: string | null,
    installment?: { current: number, total: number, baseDescription: string }
  }
}
```

### Categories (Read-Only, Seeded at Startup)
```ts
{
  _id: ObjectId,
  name: string,           // "Food & Groceries", "Transportation"...
  color: string,          // Hex (#f59e0b)
  hint: string,           // AI prompt context
  icon: string,           // Emoji (🍔)
  order: number,
  subcategories: [        // Nested array
    { _id: string, name: string }  // "Supermarket", "Restaurant"...
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**11 Categories:**
1. Food & Groceries 🍔 → Supermarket, Restaurant, Delivery, Other
2. Transportation 🚗 → Ride Share, Public Transport, Car Maintenance, Other
3. Housing 🏠 → Rent/Mortgage, Utilities, Condo Fees, Maintenance, Other
4. Bills & Subscriptions 📄 → Streaming, Software/SaaS, Gym, Insurance, Bank Fees, Other
5. Entertainment 🎬 → Movies/Events, Games, Books/Hobbies, Sports/Activities, Travel/Tourism, Other
6. Shopping 🛍️ → Clothing/Shoes, Electronics, Personal Care, Home Goods, Gifts, Other
7. Health 💊 → Pharmacy, Hospital/Doctor, Insurance, Other
8. Education 📚 → Courses/Certifications, Books/Materials, Other
9. Work 💼 → Equipment, Services, Business Travel, Other
10. Financial 💰 → Investments/Savings, Loans/Debt, Taxes, Other
11. Other 📦 → Cash Withdrawal, Uncategorized, Other

### Indexes
**Expenses:**
- `{ statementYear: 1, statementMonth: 1 }` - monthly queries
- `{ date: -1 }` - recent
- `{ categoryId: 1, subcategoryId: 1, statementYear: 1, statementMonth: 1 }` - category analysis

**Categories:**
- `{ name: 1 }` unique

### Query Patterns
- Use aggregation pipeline for joins
- Always handle empty results → return `[]` not `null`
- Use `.toArray()` for aggregations
- Convert `ObjectId` → string before sending to client
- Join categories via `$lookup` when displaying

---

## Server Actions Pattern

```ts
'use server';

export async function actionName(params): Promise<ReturnType> {
  try {
    const collection = await getCollection();
    const result = await collection.find({}).toArray();

    // Transform: ObjectId → string
    return result.map(item => ({ ...item, _id: item._id.toString() }));
  } catch (error) {
    console.error('Error in actionName:', error);
    return []; // Safe fallback
  }
}
```

**Error Handling:**
- ✓ Wrap all SA in try-catch
- ✓ Log with context
- ✓ Return typed errors: `{ success: boolean; error?: string }`
- × Never throw to client
- ✓ User-friendly messages

---

## AI Integration

### Categorization Flow
1. AI returns category name + subcategory name
2. Resolve names → ObjectIds via lookup
3. Save expense with `categoryId` + `subcategoryId`
4. Fallback: "Other" → "Uncategorized", confidence = 0

### Config
- Model: `meta-llama/llama-4-scout-17b-16e-instruct`
- Temp: 0.3 (consistent)
- JSON via `generateObject()` + Zod schema
- Timeout: 10s
- Rate limit: 200ms between batches
- Batch size: 10 expenses

### Prompt Pattern
```ts
Available categories with subcategories:
- Food & Groceries: hint text
  Subcategories: Supermarket, Restaurant, Delivery, Other
...

Return JSON: { category, subcategory, confidence, merchantName, isRecurring, suggestedBudgetCategory, notes }
```

---

## Component Structure

```
app/
├── [feature]/
│   ├── page.tsx           # SC route
│   └── components/
│       ├── client.tsx     # CA ('use client')
│       └── server.tsx     # SC
lib/
├── actions/               # SA
├── ai/                    # AI logic
├── db/                    # DB utils
└── types/                 # TS types
components/ui/             # shadcn
```

**Import Order:**
1. React/Next.js
2. Third-party
3. Local components
4. Utils/actions
5. Types

---

## Performance

### MongoDB
- Connection pooling (singleton)
- Indexes on freq queried fields
- Aggregation for complex queries
- Limit results

### Next.js
- SC for data fetching
- Suspense for streaming
- × No client-side fetching
- Static metadata

### Charts
- Lazy load Recharts
- Limit data points
- Memoize transformations

---

## Security

### MongoDB
- Env vars for connection
- Parameterized queries (driver handles)
- Validate input in SA
- × No raw string queries

### CSV Upload
- Server-side validation
- In-memory processing (no file storage)
- Sanitize before parsing

### Env
- × Never commit `.env.local`
- ✓ Use `NEXT_PUBLIC_` only for client vars
- ✓ Validate required vars at startup

---

## Git Commits

```
<type>: <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:** feat, fix, docs, style, refactor, test, chore

---

## Pre-Commit Checklist

- [ ] TS compiles
- [ ] No console errors
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Error states

---

## Commands

```bash
docker-compose up -d          # Start MongoDB
pnpm dev                      # Dev server
pnpm build                    # Production build
pnpm type-check               # TS check

# Reset categories (after schema change)
docker exec -i bufunfa-mongodb mongosh bufunfa -u bufunfa -p bufunfa_local_dev --authenticationDatabase admin --eval "db.categories.drop()"
```

---

## Common Patterns for New Features

### Adding New Collection
1. Define interface in `/lib/types/`
2. Create collection getter in `/lib/db/` with indexes
3. Add SA in `/lib/actions/` (try-catch, ObjectId → string)
4. Join in queries via `$lookup` if needed
5. Display in SC, wrap in `<Suspense>`

### Adding Category-Related Feature
- ✓ Categories are read-only (seeded at startup)
- × Don't allow create/update/delete
- Join via `$lookup` + `$unwind` for display
- Resolve names → ObjectIds before saving

### Adding AI Feature
- Use `generateObject()` + Zod schema
- Temp 0.3 for consistency
- Batch processing (10 items, 200ms delay)
- Always provide fallback
- Return names → resolve to ObjectIds

### Adding Dashboard Component
- SC fetches data via SA
- CA renders chart (Recharts)
- Get colors from `getCategoryColorMap()`
- Handle empty state
- Wrap in `<Suspense>`

---

**Last Updated:** 2026-01-25 | **Version:** 2.0.0
