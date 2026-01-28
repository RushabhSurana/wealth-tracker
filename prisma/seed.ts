/**
 * Seed script for Personal Finance Tracker
 * Creates realistic sample data in INR for India-friendly demo
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.price.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.account.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.incomeStream.deleteMany();
  await prisma.expenseItem.deleteMany();
  await prisma.netWorthSnapshot.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.settings.deleteMany();

  // Create settings
  await prisma.settings.create({
    data: {
      id: "settings",
      emergencyFundMonthsTarget: 6,
      emiToIncomeMaxPercent: 35,
      ccUtilizationMaxPercent: 30,
      allocationTargetsJson: JSON.stringify({
        equity: 40,
        mf: 25,
        crypto: 10,
        gold: 10,
        realestate: 10,
        other: 5,
      }),
    },
  });

  // Create cash accounts
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        name: "HDFC Savings",
        type: "bank",
        currency: "INR",
        balance: 285000,
        notes: "Primary salary account",
      },
    }),
    prisma.account.create({
      data: {
        name: "SBI Savings",
        type: "bank",
        currency: "INR",
        balance: 125000,
        notes: "Emergency fund",
      },
    }),
    prisma.account.create({
      data: {
        name: "ICICI FD",
        type: "savings",
        currency: "INR",
        balance: 500000,
        notes: "Fixed deposit at 7.1%",
      },
    }),
    prisma.account.create({
      data: {
        name: "Cash Wallet",
        type: "wallet",
        currency: "INR",
        balance: 8500,
        notes: "Petty cash",
      },
    }),
  ]);

  // Create assets
  const assets = await Promise.all([
    // Indian Equities
    prisma.asset.create({
      data: {
        name: "Reliance Industries",
        type: "equity",
        symbol: "RELIANCE",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "TCS",
        type: "equity",
        symbol: "TCS",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "HDFC Bank",
        type: "equity",
        symbol: "HDFCBANK",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "Infosys",
        type: "equity",
        symbol: "INFY",
        currency: "INR",
      },
    }),
    // US Equities
    prisma.asset.create({
      data: {
        name: "Apple Inc",
        type: "equity",
        symbol: "AAPL",
        currency: "INR",
        notes: "Via Vested/INDMoney",
      },
    }),
    // Mutual Funds
    prisma.asset.create({
      data: {
        name: "Axis Bluechip Fund",
        type: "mf",
        symbol: "AXIS-BLUECHIP",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "HDFC Flexi Cap Fund",
        type: "mf",
        symbol: "HDFC-FLEXICAP",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "SBI Small Cap Fund",
        type: "mf",
        symbol: "SBI-SMALLCAP",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "UTI Nifty 50 Index",
        type: "mf",
        symbol: "UTI-NIFTY50",
        currency: "INR",
      },
    }),
    // Crypto
    prisma.asset.create({
      data: {
        name: "Bitcoin",
        type: "crypto",
        symbol: "BTC",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "Ethereum",
        type: "crypto",
        symbol: "ETH",
        currency: "INR",
      },
    }),
    prisma.asset.create({
      data: {
        name: "Solana",
        type: "crypto",
        symbol: "SOL",
        currency: "INR",
      },
    }),
    // Gold
    prisma.asset.create({
      data: {
        name: "Physical Gold",
        type: "gold",
        symbol: "GOLD",
        currency: "INR",
        notes: "Gold coins and jewelry",
      },
    }),
    // Real Estate
    prisma.asset.create({
      data: {
        name: "Apartment - Bangalore",
        type: "realestate",
        symbol: null,
        currency: "INR",
        notes: "2BHK in Whitefield",
      },
    }),
    // Vehicle
    prisma.asset.create({
      data: {
        name: "Honda City",
        type: "vehicle",
        symbol: null,
        currency: "INR",
        notes: "2022 model",
      },
    }),
  ]);

  // Create holdings
  const assetMap = new Map(assets.map((a) => [a.symbol || a.name, a]));

  await Promise.all([
    // Equities
    prisma.holding.create({
      data: {
        assetId: assetMap.get("RELIANCE")!.id,
        units: 25,
        avgCost: 2380,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("TCS")!.id,
        units: 15,
        avgCost: 3650,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("HDFCBANK")!.id,
        units: 40,
        avgCost: 1580,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("INFY")!.id,
        units: 30,
        avgCost: 1420,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("AAPL")!.id,
        units: 5,
        avgCost: 14500,
      },
    }),
    // Mutual Funds (units = NAV units)
    prisma.holding.create({
      data: {
        assetId: assetMap.get("AXIS-BLUECHIP")!.id,
        units: 2500,
        avgCost: 48.5,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("HDFC-FLEXICAP")!.id,
        units: 150,
        avgCost: 1480,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("SBI-SMALLCAP")!.id,
        units: 800,
        avgCost: 155,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("UTI-NIFTY50")!.id,
        units: 500,
        avgCost: 138,
      },
    }),
    // Crypto
    prisma.holding.create({
      data: {
        assetId: assetMap.get("BTC")!.id,
        units: 0.015,
        avgCost: 6800000,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("ETH")!.id,
        units: 0.5,
        avgCost: 265000,
      },
    }),
    prisma.holding.create({
      data: {
        assetId: assetMap.get("SOL")!.id,
        units: 10,
        avgCost: 14500,
      },
    }),
    // Gold (grams)
    prisma.holding.create({
      data: {
        assetId: assetMap.get("GOLD")!.id,
        units: 50, // 50 grams
        avgCost: 6800,
      },
    }),
    // Real Estate (manual valuation - 1 unit)
    prisma.holding.create({
      data: {
        assetId: assetMap.get("Apartment - Bangalore")!.id,
        units: 1,
        avgCost: 7500000, // Purchase price
      },
    }),
    // Vehicle (1 unit, depreciating)
    prisma.holding.create({
      data: {
        assetId: assetMap.get("Honda City")!.id,
        units: 1,
        avgCost: 1200000,
      },
    }),
  ]);

  // Seed initial prices
  const now = new Date();
  await Promise.all([
    prisma.price.create({ data: { assetId: assetMap.get("RELIANCE")!.id, price: 2450, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("TCS")!.id, price: 3850, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("HDFCBANK")!.id, price: 1650, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("INFY")!.id, price: 1480, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("AAPL")!.id, price: 15200, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("AXIS-BLUECHIP")!.id, price: 52.5, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("HDFC-FLEXICAP")!.id, price: 1580, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("SBI-SMALLCAP")!.id, price: 168, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("UTI-NIFTY50")!.id, price: 145, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("BTC")!.id, price: 7250000, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("ETH")!.id, price: 285000, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("SOL")!.id, price: 15800, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("GOLD")!.id, price: 7250, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("Apartment - Bangalore")!.id, price: 8500000, asOf: now } }),
    prisma.price.create({ data: { assetId: assetMap.get("Honda City")!.id, price: 950000, asOf: now } }),
  ]);

  // Create debts
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(5);

  await Promise.all([
    prisma.debt.create({
      data: {
        name: "Home Loan - Apartment",
        type: "home",
        principal: 6000000,
        currentBalance: 5650000,
        apr: 0.085, // 8.5%
        emi: 58500,
        startDate: twoYearsAgo,
        tenureMonths: 240, // 20 years
        nextDueDate: nextMonth,
        notes: "SBI Home Loan",
      },
    }),
    prisma.debt.create({
      data: {
        name: "Car Loan - Honda City",
        type: "auto",
        principal: 900000,
        currentBalance: 520000,
        apr: 0.095, // 9.5%
        emi: 19500,
        startDate: oneYearAgo,
        tenureMonths: 60, // 5 years
        nextDueDate: nextMonth,
        notes: "HDFC Auto Loan",
      },
    }),
    prisma.debt.create({
      data: {
        name: "HDFC Credit Card",
        type: "cc",
        principal: 85000,
        currentBalance: 85000,
        apr: 0.42, // 42% APR (3.5% monthly)
        emi: 85000, // Full payment expected
        startDate: new Date(),
        tenureMonths: 1,
        nextDueDate: nextMonth,
        notes: "Outstanding balance",
      },
    }),
    prisma.debt.create({
      data: {
        name: "Personal Loan - Renovation",
        type: "personal",
        principal: 300000,
        currentBalance: 180000,
        apr: 0.14, // 14%
        emi: 12500,
        startDate: oneYearAgo,
        tenureMonths: 36,
        nextDueDate: nextMonth,
        notes: "Borrowed for home renovation",
      },
    }),
  ]);

  // Create income streams
  await Promise.all([
    prisma.incomeStream.create({
      data: {
        name: "Primary Salary",
        type: "salary",
        amountMonthly: 185000,
        startDate: twoYearsAgo,
        notes: "Software Engineer at Tech Corp",
      },
    }),
    prisma.incomeStream.create({
      data: {
        name: "Freelance Projects",
        type: "freelance",
        amountMonthly: 25000,
        startDate: oneYearAgo,
        notes: "Weekend consulting",
      },
    }),
    prisma.incomeStream.create({
      data: {
        name: "Dividend Income",
        type: "dividend",
        amountMonthly: 2500,
        startDate: oneYearAgo,
        notes: "From equity holdings",
      },
    }),
  ]);

  // Create expense items
  await Promise.all([
    // Fixed expenses
    prisma.expenseItem.create({
      data: {
        name: "Rent / Housing",
        category: "housing",
        amountMonthly: 0, // Owns apartment
        type: "fixed",
        startDate: twoYearsAgo,
        notes: "Own home, no rent",
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Society Maintenance",
        category: "housing",
        amountMonthly: 5500,
        type: "fixed",
        startDate: twoYearsAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Netflix + Hotstar + Prime",
        category: "entertainment",
        amountMonthly: 1200,
        type: "fixed",
        startDate: oneYearAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Internet + Mobile",
        category: "utilities",
        amountMonthly: 1500,
        type: "fixed",
        startDate: twoYearsAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Electricity",
        category: "utilities",
        amountMonthly: 3500,
        type: "fixed",
        startDate: twoYearsAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Health Insurance",
        category: "health",
        amountMonthly: 2000,
        type: "fixed",
        startDate: oneYearAgo,
        notes: "Family floater 10L cover",
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Term Insurance",
        category: "other",
        amountMonthly: 1500,
        type: "fixed",
        startDate: oneYearAgo,
        notes: "1Cr cover",
      },
    }),
    // Variable expenses
    prisma.expenseItem.create({
      data: {
        name: "Groceries",
        category: "food",
        amountMonthly: 12000,
        type: "variable",
        startDate: twoYearsAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Dining Out",
        category: "food",
        amountMonthly: 8000,
        type: "variable",
        startDate: twoYearsAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Fuel",
        category: "transport",
        amountMonthly: 6000,
        type: "variable",
        startDate: oneYearAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Shopping",
        category: "other",
        amountMonthly: 5000,
        type: "variable",
        startDate: twoYearsAgo,
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Travel & Vacation",
        category: "entertainment",
        amountMonthly: 8000,
        type: "variable",
        startDate: twoYearsAgo,
        notes: "Average monthly spend",
      },
    }),
    prisma.expenseItem.create({
      data: {
        name: "Personal Care",
        category: "health",
        amountMonthly: 2500,
        type: "variable",
        startDate: twoYearsAgo,
      },
    }),
  ]);

  // Create some historical net worth snapshots
  const monthsBack = 6;
  for (let i = monthsBack; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    // Simulate growth
    const growthFactor = 1 + (monthsBack - i) * 0.02;
    const baseAssets = 11500000;
    const baseLiabilities = 6435000;

    await prisma.netWorthSnapshot.create({
      data: {
        asOfMonth: date,
        totalAssets: Math.round(baseAssets * growthFactor),
        totalLiabilities: Math.round(baseLiabilities * (1 - (monthsBack - i) * 0.01)),
        netWorth: Math.round(baseAssets * growthFactor - baseLiabilities * (1 - (monthsBack - i) * 0.01)),
        liquidAssets: Math.round(2500000 * growthFactor),
        liquidNetWorth: Math.round(2200000 * growthFactor),
      },
    });
  }

  // Create savings goals
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

  await Promise.all([
    prisma.savingsGoal.create({
      data: {
        name: "Emergency Fund",
        targetAmount: 600000, // 6 months of expenses
        currentAmount: 410000,
        deadline: sixMonthsFromNow,
        category: "emergency",
        priority: 1,
        notes: "Target: 6 months of expenses",
      },
    }),
    prisma.savingsGoal.create({
      data: {
        name: "International Vacation",
        targetAmount: 300000,
        currentAmount: 85000,
        deadline: oneYearFromNow,
        category: "vacation",
        priority: 3,
        notes: "Europe trip with family",
      },
    }),
    prisma.savingsGoal.create({
      data: {
        name: "Home Down Payment",
        targetAmount: 2000000,
        currentAmount: 450000,
        deadline: fiveYearsFromNow,
        category: "house",
        priority: 2,
        notes: "For second property investment",
      },
    }),
    prisma.savingsGoal.create({
      data: {
        name: "New Laptop",
        targetAmount: 150000,
        currentAmount: 150000,
        deadline: null,
        category: "other",
        priority: 4,
        isCompleted: true,
        completedAt: new Date(),
        notes: "MacBook Pro M3",
      },
    }),
  ]);

  // Create budget categories
  await Promise.all([
    prisma.budgetCategory.create({
      data: { category: "food", monthlyLimit: 25000 },
    }),
    prisma.budgetCategory.create({
      data: { category: "transport", monthlyLimit: 8000 },
    }),
    prisma.budgetCategory.create({
      data: { category: "entertainment", monthlyLimit: 12000 },
    }),
    prisma.budgetCategory.create({
      data: { category: "utilities", monthlyLimit: 8000 },
    }),
    prisma.budgetCategory.create({
      data: { category: "health", monthlyLimit: 5000 },
    }),
  ]);

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
