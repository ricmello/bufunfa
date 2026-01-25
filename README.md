# Bufunfa 💰

**Privacy-First Agentic Expense Manager**

A self-hosted expense tracking application with AI-powered categorization. Import your credit card statements, visualize spending patterns, and keep your financial data completely private.

## Features

- 📊 **AI-Powered Categorization** - Automatically categorize expenses using Groq AI
- 🔒 **Privacy First** - All data stored locally, no cloud required
- 📈 **Beautiful Charts** - Visualize spending with interactive charts
- 📁 **CSV Import** - Easy import from credit card statements
- 🌙 **Dark Mode** - Full dark mode support
- 🐳 **Docker Ready** - One-command setup with Docker Compose

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- Docker & Docker Compose
- Groq API Key (get free at [console.groq.com](https://console.groq.com))

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd bufunfa
```

2. Install dependencies
```bash
pnpm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local and add your Groq API key
```

4. Start MongoDB
```bash
docker-compose up -d
```

5. Run the development server
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Importing Expenses

1. Navigate to the **Import** page
2. Upload your CSV file (format: Date, Description, Amount)
3. Select the statement month and year
4. Click Import - AI will automatically categorize each transaction

### CSV Format

Your CSV file should have the following columns:

```csv
Date,Description,Amount
2026-01-15,UBER TRIP #12345,-25.50
2026-01-14,GROCERY STORE INC,-127.89
2026-01-13,SALARY DEPOSIT,3500.00
```

See `sample-statement.csv` for an example.

### Dashboard

View your financial overview:
- Recent expenses (last 7 days)
- Top 10 biggest expenses
- Monthly spending trends (6 months)

### Settings

- View database statistics
- Delete all data (use with caution!)

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Recharts
- **Database:** MongoDB 8.0
- **AI:** Groq (llama-3.3-70b-versatile)
- **CSV:** PapaParse

## Project Structure

```
bufunfa/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page & components
│   ├── import/            # CSV import page & components
│   └── settings/          # Settings page & components
├── components/            # Shared components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── actions/          # Server Actions
│   ├── ai/               # AI categorization logic
│   ├── db/               # Database utilities
│   └── types/            # TypeScript types
├── docker-compose.yml     # MongoDB setup
└── CLAUDE.md             # Development guidelines
```

## Development

### Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run linter
```

### Docker Commands

```bash
docker-compose up -d       # Start MongoDB
docker-compose down        # Stop MongoDB
docker-compose logs -f     # View logs
docker-compose restart     # Restart services
```

## Configuration

### Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `GROQ_API_KEY` - Groq API key for AI categorization
- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_APP_URL` - Application URL

## Roadmap

- [ ] Budget tracking and alerts
- [ ] Multi-user support with authentication
- [ ] Recurring transaction management
- [ ] Export to PDF/CSV
- [ ] Custom category creation
- [ ] Receipt photo attachment
- [ ] Mobile app (React Native)

## Contributing

Contributions are welcome! Please read [CLAUDE.md](./CLAUDE.md) for development guidelines.

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using Next.js and AI
