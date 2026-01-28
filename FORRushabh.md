# WealthTracker: A Deep Dive for Rushabh

Hey Rushabh! You just built a production-grade personal finance app. Let's break down what you created, why it works the way it does, and what you can learn from the journey.

---

## The Big Picture: What Did We Actually Build?

Imagine you're building a house. You need:
- A **foundation** (database)
- **Walls and rooms** (pages and components)
- **Plumbing** (data flow and server actions)
- **Electricity** (interactivity and state)
- **Interior design** (UI and styling)

WealthTracker is that house for your finances. Let's tour each floor.

---

## Part 1: The Technology Stack (Why These Tools?)

### Next.js 16 with App Router
**What it is:** A React framework that handles both the frontend AND backend.

**Why we chose it:**
Think of traditional web apps like a restaurant where you order food (frontend), and the kitchen is in a completely different building (backend API). Next.js is like having the kitchen right behind the counter—everything is in one place.

The "App Router" is the newer way Next.js organizes pages. Instead of a `pages/` folder, we use `app/` with a file-based routing system:
```
app/
  page.tsx        → localhost:3000/
  cashflow/
    page.tsx      → localhost:3000/cashflow
  debts/
    page.tsx      → localhost:3000/debts
```

**The magic:** Each folder becomes a URL. No router configuration needed.

### TypeScript
**What it is:** JavaScript with types—like spell-check for your code.

**Why we chose it:**
```typescript
// Without TypeScript (JavaScript)
function calculateNetWorth(assets, liabilities) {
  return assets - liabilities;  // What if someone passes a string?
}

// With TypeScript
function calculateNetWorth(assets: number, liabilities: number): number {
  return assets - liabilities;  // TypeScript yells if you pass wrong types
}
```

TypeScript caught several bugs before they happened. When we defined `ExpenseItem` with specific categories, TypeScript ensured we never accidentally used "Food" when the system expected "food".

### SQLite + Prisma
**What it is:** SQLite is a database in a single file. Prisma is the translator between your code and the database.

**Why we chose it:**
Your requirement was "zero external dependencies, no credentials needed." SQLite is perfect because:
- It's just a file (`prisma/dev.db`)
- No database server to run
- Works offline
- You can literally copy the file to back up your data

**Prisma is the magic layer:**
```typescript
// Without Prisma (raw SQL)
const result = await db.query(
  "SELECT * FROM accounts WHERE type = 'bank' ORDER BY balance DESC"
);

// With Prisma (type-safe, autocomplete-friendly)
const accounts = await prisma.account.findMany({
  where: { type: "bank" },
  orderBy: { balance: "desc" },
});
```

Prisma gives you autocomplete, type safety, and generates the SQL for you.

### Tailwind CSS
**What it is:** Utility classes for styling instead of writing CSS files.

**Why we chose it:**
```html
<!-- Traditional CSS approach -->
<div class="card">...</div>
<!-- Then in styles.css: .card { padding: 1rem; background: white; ... } -->

<!-- Tailwind approach -->
<div class="p-4 bg-white rounded-lg shadow-sm">...</div>
```

Tailwind keeps styles next to your HTML. No jumping between files. And with dark mode:
```html
<div class="bg-white dark:bg-gray-900">...</div>
```

One class handles both themes.

### Recharts
**What it is:** React charts library.

**Why we chose it:** It's React-native (components, not imperative code) and handles responsive sizing beautifully. The donut charts and line charts "just work."

---

## Part 2: The Architecture (How Things Connect)

### The Flow of Data

```
User clicks "Add Expense"
        ↓
expense-list.tsx (Client Component)
        ↓
createExpenseItem() (Server Action)
        ↓
Prisma ORM
        ↓
SQLite Database
        ↓
revalidatePath("/cashflow")
        ↓
Page re-renders with new data
```

This is called **Server Actions**—a Next.js 14+ feature. Instead of:
1. Frontend calls API
2. API validates request
3. API talks to database
4. API returns response
5. Frontend updates

We just have:
1. Frontend calls server function directly
2. Server function talks to database
3. Page automatically refreshes

**50% less code, 50% fewer bugs.**

### Server Components vs Client Components

This confused even experienced developers when Next.js introduced it. Here's the simple version:

**Server Components** (default):
- Run on the server
- Can directly access the database
- Can't use `useState`, `useEffect`, or browser APIs
- Faster initial load (no JavaScript sent to browser)

**Client Components** (marked with `"use client"`):
- Run in the browser
- Can use React hooks
- Handle user interactions
- Needed for forms, modals, and anything interactive

**Our pattern:**
```
page.tsx (Server) → Fetches data, renders layout
    ↓
expense-list.tsx (Client) → Handles form state, modals, user input
```

The page is fast (server-rendered), but the interactive parts work in the browser.

### The Calculation Layer

We separated business logic from UI:
```
src/lib/calc/
  networth.ts   → Net worth calculations
  cashflow.ts   → Income/expense/runway calculations
  payoff.ts     → Debt payoff simulator
```

**Why separate?**
1. **Testable:** We can test calculations without rendering React
2. **Reusable:** Dashboard, Cashflow page, and API can all use the same functions
3. **Maintainable:** Change the formula once, it updates everywhere

This is the **Single Responsibility Principle**—each file does one thing well.

---

## Part 3: The Bugs We Hit (And How We Fixed Them)

### Bug #1: Prisma 7.x Breaking Change

**What happened:**
```
Error: The datasource property 'url' is no longer supported in schema files
```

Prisma 7 changed how you configure the database URL. Our `prisma/schema.prisma` used the old syntax.

**The fix:** Downgrade to Prisma 5.22.0 in `package.json`. Sometimes the newest version isn't the best choice—stability matters.

**Lesson:** When a major version breaks things, check if you actually need the new features. If not, stick with what works.

### Bug #2: Date Input Type Mismatch

**What happened:**
```typescript
// The form state
const [formData, setFormData] = useState({
  startDate: formatInputDate(new Date()),  // Returns string like "2025-01-28"
});

// But TypeScript saw it could be Date | string
<Input value={formData.startDate} />  // Error! Input expects string only
```

**The fix:**
```typescript
<Input value={String(formData.startDate)} />
```

Explicit conversion. TypeScript was right to complain—we were being ambiguous.

**Lesson:** TypeScript errors feel annoying, but they're catching real bugs. The date could have been a Date object somewhere, and the input would have shown `[object Object]`.

### Bug #3: Passing Functions to Server Components

**What happened:**
```typescript
// In page.tsx (Server Component)
<DonutChart labelFormatter={getExpenseCategoryLabel} />
```

Error: "Functions cannot be passed directly to Client Components"

**Why it happens:**
Server Components can't serialize functions to send to the browser. It's like trying to fax a live phone call—you can send a transcript, but not the actual conversation.

**The fix:**
```typescript
// Before: Pass function
labelFormatter={getExpenseCategoryLabel}

// After: Pass string identifier, component picks the function
formatterType="expense"
```

The client component has its own copy of the formatters and picks based on the string.

**Lesson:** Server and Client components live in different worlds. Data (strings, numbers, objects) can cross the boundary. Functions cannot.

### Bug #4: Recharts Tooltip Type Error

**What happened:**
```typescript
formatter={(value: number, name: string) => [formatCurrency(value), name]}
// Error: Type 'number | undefined' is not assignable to type 'number'
```

Recharts updated their types. The value might be undefined.

**The fix:**
```typescript
formatter={(value) => formatCurrency(Number(value))}
```

Handle the possibility gracefully.

**Lesson:** Library updates can change types. `Number(undefined)` returns `NaN`, but our `formatCurrency` handles that.

---

## Part 4: Patterns We Used (Best Practices)

### Pattern 1: Colocation
Keep related files together:
```
app/cashflow/
  page.tsx          ← The page
  expense-list.tsx  ← Component only used here
  income-list.tsx   ← Component only used here
```

Don't put `expense-list.tsx` in a global `components/` folder if only one page uses it.

### Pattern 2: Zod Validation
```typescript
const ExpenseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["housing", "food", ...]),
  amountMonthly: z.number().positive(),
});

// In the server action
const validated = ExpenseSchema.parse(data);  // Throws if invalid
```

Validate on the server, even if you validate on the client. Never trust user input.

### Pattern 3: Optimistic Assumptions, Pessimistic Defaults
```typescript
// Optimistic: Assume the happy path
const settings = await prisma.settings.findFirst();

// Pessimistic: Have safe defaults
const allocationTargets = settings?.allocationTargetsJson
  ? JSON.parse(settings.allocationTargetsJson)
  : { equity: 40, mf: 25, ... };  // Safe defaults
```

Assume things work, but handle when they don't.

### Pattern 4: Domain-Driven File Organization
```
lib/
  actions/     ← Server actions (verbs: create, update, delete)
  calc/        ← Pure calculations (math, no side effects)
  prices/      ← Price fetching abstraction
  rules/       ← Alert/rule engine
  types.ts     ← Shared type definitions
  utils.ts     ← Generic utilities
```

Group by what things *do*, not what they *are*.

---

## Part 5: The Mental Models (How Engineers Think)

### Abstraction Layers
We built a price provider abstraction:
```typescript
interface PriceProvider {
  getPrice(symbol: string): Promise<number | null>;
  getBatchPrices(symbols: string[]): Promise<Map<string, number>>;
}
```

Currently, we use a mock provider with random walks. But because of this interface:
- You can add Yahoo Finance later
- You can add CoinGecko later
- The rest of the app doesn't change

**Think in interfaces, not implementations.**

### The Rule of Three
We didn't abstract early. When we had similar code in 2 places, we left it. When it appeared a third time, we extracted it.

Example: `formatCurrency` is used everywhere, so it's in `utils.ts`. But `getDebtTypeLabel` is only used in a few places—we didn't create a whole "labels" module.

**Don't abstract until you feel the pain of repetition.**

### Fail Fast
```typescript
export function calculateSavingsRate(freeCashflow: number, totalIncome: number): number {
  if (totalIncome === 0) return 0;  // Don't divide by zero
  // ...
}
```

Check for invalid states early. Return early. Don't let bad data propagate.

### Make Invalid States Unrepresentable
```typescript
type DebtType = "home" | "auto" | "personal" | "education" | "cc";
```

You literally cannot create a debt with type "mortgage"—TypeScript won't allow it. The type system enforces business rules.

---

## Part 6: What You Can Build Next

### Easy Wins
1. **Bill Reminders:** Check `nextDueDate` on debts, show alerts 5 days before
2. **Rebalancing Suggestions:** Compare current allocation to target, show deviation
3. **Monthly Email Summary:** Use a cron job to email yourself

### Medium Challenges
4. **Real Stock Prices:** Integrate Yahoo Finance API for NSE stocks
5. **PDF Reports:** Use `@react-pdf/renderer` to generate monthly summaries
6. **Recurring Transactions:** Add `isRecurring` flag, auto-generate each month

### Advanced
7. **Multi-Currency Support:** Add exchange rates, convert to base currency
8. **Tax Optimization:** Track LTCG/STCG, suggest tax-loss harvesting
9. **Family Sharing:** Add authentication, multiple users per household

---

## Part 7: The Files That Matter Most

If you want to understand the codebase, read these in order:

1. **`prisma/schema.prisma`** - The data model. Everything flows from here.
2. **`src/lib/types.ts`** - The TypeScript types. Shows what data looks like.
3. **`src/lib/actions/dashboard.ts`** - How we aggregate data for the dashboard.
4. **`src/app/page.tsx`** - The main dashboard. Shows Server Component patterns.
5. **`src/app/cashflow/expense-list.tsx`** - A Client Component with forms/modals.
6. **`src/lib/calc/payoff.ts`** - Pure business logic, well-tested.

---

## Part 8: Commands to Remember

```bash
# Development
npm run dev          # Start dev server

# Database
npx prisma studio    # Visual database editor
npx prisma db push   # Apply schema changes
npx prisma db seed   # Reset and seed data

# Testing
npm test             # Run tests
npm run build        # Check for errors before deploying

# Data
rm prisma/dev.db     # Delete all data (fresh start)
```

---

## Final Thoughts

You built something real. Not a tutorial project, not a toy—an actual tool you can use daily.

The code isn't perfect (no code is), but it follows solid principles:
- Separation of concerns
- Type safety
- Server-first rendering
- Progressive enhancement

The bugs we hit? Every professional developer hits them. The difference is knowing how to debug:
1. Read the error message carefully
2. Understand what the error is asking for
3. Fix the root cause, not the symptom

Keep building. Every project teaches you something the last one didn't.

—Claude

*P.S. The best way to learn this codebase? Break it. Change something, see what fails, understand why.*
