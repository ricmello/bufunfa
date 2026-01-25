# Bufunfa - Project Guidelines

## Overview
Bufunfa is a privacy-first, self-hosted expense manager with AI-powered categorization. Built with Next.js 16, MongoDB, and Groq AI, it allows users to import credit card statements and visualize spending patterns without sharing data with third parties.

## Architecture Principles

### Privacy First
- All data stored locally in MongoDB
- Only Groq API used for AI categorization (transaction descriptions only)
- No user authentication required for local deployment
- Self-hosted via Docker Compose
- No telemetry or analytics

### Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB 8.0 with native driver
- **AI:** Groq with `meta-llama/llama-4-scout-17b-16e-instruct` model (Llama 4 Scout)
- **Charts:** Recharts via shadcn/ui chart components
- **CSV Parsing:** PapaParse
- **UI Components:** shadcn/ui with Tailwind CSS
- **State Management:** React Server Components (no client state library)
- **Data Layer:** Next.js Server Actions (no API routes)

## Code Standards

### TypeScript
- Strict mode enabled
- All functions must have explicit return types
- Use interfaces for data structures
- Prefer `type` for unions and `interface` for objects
- No `any` types (use `unknown` if absolutely necessary)

### React Patterns
- **Server Components by default** - Only use `'use client'` when necessary (interactivity, hooks, browser APIs)
- **Suspense boundaries** - Wrap async components with `<Suspense>` and provide loading skeletons
- **Error boundaries** - Handle errors gracefully with try-catch in Server Actions
- **Server Actions** - Prefix files with `'use server'` directive
- **No prop drilling** - Keep component trees shallow, use Server Components to fetch data where needed

### File Naming Conventions
- **Components:** `kebab-case.tsx` (e.g., `csv-dropzone.tsx`)
- **Actions:** `kebab-case.ts` in `/lib/actions/`
- **Pages:** `page.tsx` following Next.js App Router conventions
- **Types:** `kebab-case.ts` in `/lib/types/`
- **Constants:** ALL_CAPS for exported constants

### Styling
- **Tailwind CSS only** - No custom CSS files except `globals.css`
- **shadcn/ui components** - Prefer using existing components
- **Responsive design** - Mobile-first approach, use Tailwind breakpoints
- **Dark mode** - Support via Tailwind dark mode classes
- **Consistent spacing** - Use Tailwind spacing scale (4, 6, 8, etc.)

## Database Patterns

### Collection Structure
```typescript
// expenses collection
{
  _id: ObjectId,
  description: string,
  amount: number,
  date: Date,
  category: string,
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
    notes: string | null
  }
}
```

### Indexes
- `{ statementYear: 1, statementMonth: 1 }` - Monthly queries
- `{ date: -1 }` - Recent expenses
- `{ category: 1, statementYear: 1, statementMonth: 1 }` - Category analysis

### Query Patterns
- Use aggregation pipeline for complex queries
- Always handle empty results gracefully
- Return empty arrays instead of null
- Use `.toArray()` for aggregations
- Convert ObjectId to string when sending to client

## Server Actions Patterns

### Structure
```typescript
'use server';

export async function actionName(params): Promise<ReturnType> {
  try {
    // 1. Get collection
    const collection = await getExpensesCollection();

    // 2. Perform operation
    const result = await collection.find({}).toArray();

    // 3. Transform data (remove MongoDB-specific types)
    return result.map(item => ({
      ...item,
      _id: item._id.toString(),
    }));
  } catch (error) {
    console.error('Error in actionName:', error);
    // 4. Return safe fallback
    return [];
  }
}
```

### Error Handling
- Always wrap in try-catch
- Log errors with context
- Return typed error objects: `{ success: boolean; error?: string }`
- Never throw errors to client
- Provide user-friendly error messages

## AI Integration Guidelines

### Categorization
- Model: `meta-llama/llama-4-scout-17b-16e-instruct` (Llama 4 Scout)
- Temperature: 0.3 (consistent results)
- JSON Schema: Native support via `generateObject()`
- Timeout: 10 seconds
- Fallback: Category = "Other", confidence = 0
- Rate limiting: 200ms delay between batches during import
- Batch size: 10 expenses per batch

### Prompt Engineering
- Clear instructions with examples
- Structured JSON output using Zod schema
- Include all possible categories
- Request confidence score
- Extract merchant name when possible

### Categories
- Food, Transport, Shopping, Entertainment, Bills, Health, Other
- Extensible via `EXPENSE_CATEGORIES` constant

## Git Commit Conventions

### Format
```
<type>: <subject>

<body>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat: add CSV import with AI categorization

Implemented CSV file upload, parsing with PapaParse, and batch
categorization using Groq AI. Includes progress indicators and
confirmation dialog for month/year selection.
```

## Component Organization

### Structure
```
app/
├── [feature]/
│   ├── page.tsx              # Route page (Server Component)
│   └── components/
│       ├── client-comp.tsx   # 'use client' components
│       └── server-comp.tsx   # Server Components
lib/
├── actions/                  # Server Actions
├── ai/                       # AI logic
├── db/                       # Database utilities
└── types/                    # TypeScript types
components/
└── ui/                       # shadcn/ui components
```

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities/actions
5. Types
6. Styles

## Performance Considerations

### MongoDB
- Connection pooling via singleton pattern
- Indexes on frequently queried fields
- Aggregation pipeline for complex queries
- Limit results in dashboard queries

### Next.js
- Server Components for data fetching
- Suspense boundaries for streaming
- No client-side data fetching
- Static metadata where possible

### Charts
- Lazy load Recharts components
- Limit data points displayed
- Responsive sizing
- Memoize chart data transformations

## Security Best Practices

### MongoDB
- Use connection string from environment variables
- Parameterized queries (MongoDB driver handles this)
- Validate input in Server Actions
- No raw string queries

### File Upload
- Server-side validation of CSV format
- File size limits (handled by browser)
- Sanitize file content before parsing
- No file storage (process in memory)

### Environment Variables
- Never commit `.env.local`
- Provide `.env.example` template
- Use `NEXT_PUBLIC_` prefix only for client-exposed vars
- Validate required env vars on startup

## Testing Checklist

### Before Committing
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Dark mode works correctly
- [ ] Mobile responsive
- [ ] Loading states display
- [ ] Error states handled

### End-to-End Test Flow
1. Start MongoDB: `docker-compose up -d`
2. Start Next.js: `pnpm dev`
3. Import sample CSV
4. Verify AI categorization
5. Check dashboard charts
6. Test settings page
7. Verify delete all data

## Future Enhancements

### Planned Features
- Multi-user support (add userId to schema)
- Budget tracking and alerts
- Recurring transaction detection improvements
- Export to CSV/PDF
- Custom category creation
- Currency conversion
- Receipt attachment support

### Scalability Considerations
- Ready for multi-tenancy (add userId field)
- Database sharding strategy
- Caching layer (Redis)
- Background job processing for imports
- Rate limiting for AI requests

## Development Commands

```bash
# Start MongoDB
docker-compose up -d

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm type-check
```

## Environment Setup

### Prerequisites
- Node.js 18+ (20+ recommended)
- pnpm 9+
- Docker and Docker Compose
- Groq API key (free tier available)

### Initial Setup
1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Add Groq API key to `.env.local`
4. Run `docker-compose up -d` to start MongoDB
5. Run `pnpm install`
6. Run `pnpm dev`
7. Navigate to `http://localhost:3000`

## Troubleshooting

### MongoDB Connection Issues
- Check Docker container is running: `docker ps`
- Verify credentials in `.env.local`
- Check port 27017 is not in use
- Restart containers: `docker-compose restart`

### AI Categorization Failures
- Verify Groq API key is valid
- Check API rate limits
- Fallback to "Other" category on error
- Check console logs for error details

### Import Issues
- Verify CSV format (Date, Description, Amount)
- Check date format compatibility
- Ensure amount parsing handles currency symbols
- Review console logs for parsing errors

## Contributing Guidelines

### Pull Request Process
1. Create feature branch from main
2. Follow code standards and conventions
3. Add tests if applicable
4. Update CLAUDE.md if architecture changes
5. Ensure all checks pass
6. Request review

### Code Review Focus
- Type safety
- Error handling
- Performance implications
- Security considerations
- User experience
- Code readability

---

**Last Updated:** 2026-01-25
**Version:** 1.0.0
**Maintainer:** AI-assisted development with Claude
