/**
 * Cashflow Calculation Functions
 * Monthly income, expenses, savings rate, and runway calculations
 */

import type { CashflowSummary } from "../types";

export interface IncomeItem {
  amountMonthly: number;
}

export interface ExpenseItem {
  amountMonthly: number;
  category: string;
}

export interface DebtItem {
  emi: number;
}

/**
 * Calculate total monthly income
 */
export function calculateTotalIncome(incomes: IncomeItem[]): number {
  return incomes.reduce((sum, i) => sum + i.amountMonthly, 0);
}

/**
 * Calculate total monthly expenses (excluding EMIs)
 */
export function calculateTotalExpenses(expenses: ExpenseItem[]): number {
  return expenses
    .filter((e) => e.category !== "emi")
    .reduce((sum, e) => sum + e.amountMonthly, 0);
}

/**
 * Calculate total monthly EMI payments
 */
export function calculateTotalEmi(debts: DebtItem[]): number {
  return debts.reduce((sum, d) => sum + d.emi, 0);
}

/**
 * Calculate free cashflow (income - expenses - EMIs)
 */
export function calculateFreeCashflow(
  totalIncome: number,
  totalExpenses: number,
  totalEmi: number
): number {
  return totalIncome - totalExpenses - totalEmi;
}

/**
 * Calculate savings rate as percentage
 * Savings rate = (Free Cashflow / Total Income) * 100
 */
export function calculateSavingsRate(
  freeCashflow: number,
  totalIncome: number
): number {
  if (totalIncome === 0) return 0;
  const rate = (freeCashflow / totalIncome) * 100;
  return Math.round(rate * 10) / 10; // 1 decimal place
}

/**
 * Calculate runway in months
 * Runway = Liquid Assets / Monthly Burn
 * Monthly burn = expenses + EMIs (assuming income stops)
 */
export function calculateRunway(
  liquidAssets: number,
  monthlyExpenses: number,
  monthlyEmi: number
): number {
  const monthlyBurn = monthlyExpenses + monthlyEmi;
  if (monthlyBurn === 0) return Infinity;
  const runway = liquidAssets / monthlyBurn;
  return Math.round(runway * 10) / 10; // 1 decimal place
}

/**
 * Calculate complete cashflow summary
 */
export function calculateCashflowSummary(
  incomes: IncomeItem[],
  expenses: ExpenseItem[],
  debts: DebtItem[],
  liquidAssets: number
): CashflowSummary {
  const totalIncome = calculateTotalIncome(incomes);
  const totalExpenses = calculateTotalExpenses(expenses);
  const totalEmi = calculateTotalEmi(debts);
  const freeCashflow = calculateFreeCashflow(totalIncome, totalExpenses, totalEmi);
  const savingsRate = calculateSavingsRate(freeCashflow, totalIncome);
  const runwayMonths = calculateRunway(liquidAssets, totalExpenses, totalEmi);

  return {
    totalIncome,
    totalExpenses,
    totalEmi,
    freeCashflow,
    savingsRate,
    runwayMonths,
  };
}

/**
 * Calculate debt-to-income ratio
 */
export function calculateDebtToIncomeRatio(
  totalEmi: number,
  totalIncome: number
): number {
  if (totalIncome === 0) return 0;
  const ratio = (totalEmi / totalIncome) * 100;
  return Math.round(ratio * 10) / 10;
}

/**
 * Calculate expense breakdown by category
 */
export function calculateExpenseBreakdown(
  expenses: ExpenseItem[]
): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const expense of expenses) {
    breakdown[expense.category] =
      (breakdown[expense.category] || 0) + expense.amountMonthly;
  }

  return breakdown;
}

/**
 * Calculate monthly data for chart display
 */
export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  emi: number;
  savings: number;
  [key: string]: string | number;
}

export function generateMonthlyProjection(
  currentIncome: number,
  currentExpenses: number,
  currentEmi: number,
  months: number = 12
): MonthlyData[] {
  const result: MonthlyData[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthStr = date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    result.push({
      month: monthStr,
      income: currentIncome,
      expenses: currentExpenses,
      emi: currentEmi,
      savings: currentIncome - currentExpenses - currentEmi,
    });
  }

  return result;
}
