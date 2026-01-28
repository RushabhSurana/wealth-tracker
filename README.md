# WealthTracker - Personal Finance Dashboard

A comprehensive personal finance and net worth tracker built with Next.js, TypeScript, and SQLite. Track your assets, liabilities, investments, debts, and cashflow all in one place with zero external dependencies.

## Features

- **Net Worth Tracking**: Track all your assets and liabilities with automatic calculations
- **Investment Portfolio**: Monitor holdings with P&L tracking and allocation analysis
- **Debt Management**: Payoff simulator with Avalanche and Snowball strategies
- **Cashflow Analysis**: Income/expense tracking with runway calculations
- **Smart Alerts**: Rule-based financial alerts and recommendations
- **Price Provider**: Mock prices with random walk simulation (feels live with zero API keys)
- **Import/Export**: JSON data backup and restore

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# 1. Install dependencies (includes tsx for TypeScript execution)
npm install

# 2. Set up database and seed with sample data
npm run db:setup

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

That's it! The app comes pre-populated with realistic sample data so you can explore immediately.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:setup` | Generate Prisma client, push schema, and seed data |
| `npm run db:seed` | Re-seed database with sample data |
| `npm run db:reset` | Reset database (deletes all data) |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

## Project Structure

```
wealth-tracker/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Sample data seeding
│   └── dev.db             # SQLite database (auto-created)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Dashboard
│   │   ├── cashflow/      # Income/Expenses
│   │   ├── debts/         # Debt management
│   │   ├── investments/   # Portfolio tracking
│   │   └── settings/      # Configuration
│   ├── components/        # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── charts/        # Recharts wrappers
│   │   └── layout/        # Navigation, headers
│   └── lib/
│       ├── actions/       # Server actions (CRUD)
│       ├── calc/          # Financial calculations
│       ├── prices/        # Price provider abstraction
│       ├── rules/         # Alert rules engine
│       ├── db.ts          # Prisma client
│       ├── types.ts       # TypeScript types
│       └── utils.ts       # Utility functions
└── vitest.config.ts       # Test configuration
```

## Data Model

### Core Entities

| Table | Purpose |
|-------|---------|
| `Account` | Cash accounts (bank, wallet, savings) |
| `Asset` | Asset definitions (equity, MF, crypto, gold, real estate) |
| `Holding` | Your positions (units, avg cost) |
| `Price` | Historical prices for assets |
| `Debt` | Loans and credit cards |
| `IncomeStream` | Monthly income sources |
| `ExpenseItem` | Monthly expenses |
| `NetWorthSnapshot` | Historical net worth data |
| `Settings` | User preferences and targets |

### Key Relationships

- Assets have multiple Holdings (your positions)
- Assets have multiple Prices (price history)
- Holdings can optionally link to Accounts
- Settings is a singleton (one row)

## How It Works

### Net Worth Calculation

```
Net Worth = Total Assets - Total Liabilities

Total Assets = Cash Accounts + Investment Holdings (at current prices)
Total Liabilities = Sum of all debt balances

Liquid Net Worth = Liquid Assets - Short-term Debt
Liquid Assets = Cash + Equity + MF + Crypto + Gold
Short-term Debt = Credit Cards + Personal Loans
```

### Cashflow Calculation

```
Free Cashflow = Monthly Income - Monthly Expenses - Monthly EMIs
Savings Rate = Free Cashflow / Monthly Income × 100%
Runway = Liquid Assets / (Monthly Expenses + Monthly EMIs)
```

### Debt Payoff Strategies

1. **Avalanche**: Pay highest APR first (minimizes total interest)
2. **Snowball**: Pay smallest balance first (psychological wins)

The simulator shows:
- Total months to payoff
- Total interest paid
- Months/interest saved with extra payments

### Price Provider

The app uses a **Price Provider abstraction** with two implementations:

1. **Mock Provider** (default):
   - Seeded with realistic prices for Indian stocks, US stocks, crypto, MFs, and gold
   - Applies random walk to simulate price movements
   - Zero API keys required

2. **CoinGecko Provider** (optional):
   - Real crypto prices from CoinGecko's free public API
   - 5-minute cache to respect rate limits
   - Falls back to mock if API fails

### Rules Engine

Deterministic rules that generate alerts:

| Rule | Condition | Severity |
|------|-----------|----------|
| Emergency Fund | Runway < target months | High/Medium/Low |
| CC Utilization | Balance > X% of income | High/Medium/Low |
| EMI to Income | EMIs > X% of income | High/Medium/Low |
| High APR + Investments | High APR debt while holding investments | Medium |
| Negative Cashflow | Expenses > Income | High |
| Low Savings Rate | < 20% savings rate | Medium/Low |
| Allocation Drift | > 10% from targets | Low |

## Import/Export

### Export
Go to Settings → Data Management → Export JSON

Creates a JSON file with all your:
- Accounts
- Assets & Holdings
- Debts
- Income streams
- Expenses
- Settings

### Import
Go to Settings → Data Management → Import JSON

- Merges with existing data (doesn't delete)
- Skips duplicates based on name matching
- Updates settings to imported values

## Configuration

### Settings Page

- **Emergency Fund Target**: Months of expenses to maintain
- **Max EMI to Income**: Alert threshold for debt burden
- **Max CC Utilization**: Alert threshold for credit card usage
- **Target Allocation**: Desired portfolio mix (must sum to 100%)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod
- **Testing**: Vitest

## Development

### Adding a New Asset Type

1. Add type to `AssetType` in `src/lib/types.ts`
2. Update `getAssetTypeLabel` in `src/lib/utils.ts`
3. Update allocation targets in settings if needed
4. Add to seed data in `prisma/seed.ts`

### Adding a New Alert Rule

1. Create rule function in `src/lib/rules/index.ts`
2. Add to `RULES` array
3. Return `Alert` object or `null`

### Running Tests

```bash
# Watch mode
npm run test

# Single run
npm run test:run
```

## Validation Checklist

- [ ] Dashboard shows net worth and alerts
- [ ] Cashflow page shows income/expenses with runway
- [ ] Debts page shows payoff simulator with strategy comparison
- [ ] Investments page shows holdings with P&L and price refresh
- [ ] Settings page allows target configuration
- [ ] Export creates valid JSON backup
- [ ] Import restores data correctly
- [ ] All calculations match expected formulas
- [ ] Tests pass

## License

MIT
