"use server";

import { getAccounts } from "./accounts";
import { getHoldingsWithPrices, getHoldingsByType } from "./holdings";
import { getDebtsWithMetrics, getCreditCardBalance, getHighestApr, getTotalMonthlyEmi } from "./debts";
import { getTotalMonthlyIncome } from "./income";
import { getTotalMonthlyExpenses, getExpensesByCategory } from "./expenses";
import { getSettings } from "./settings";
import { getNetWorthSnapshots } from "./snapshots";
import { buildRulesContext, evaluateRules } from "@/lib/rules";
import { calculateNetWorthSummary, type AssetItem, type LiabilityItem, type CashAccount } from "@/lib/calc/networth";
import { calculateCashflowSummary, type IncomeItem, type ExpenseItem as CashflowExpenseItem, type DebtItem } from "@/lib/calc/cashflow";
import type { Alert, NetWorthSummary, CashflowSummary } from "@/lib/types";

export interface DashboardData {
  netWorth: NetWorthSummary;
  cashflow: CashflowSummary;
  alerts: Alert[];
  snapshots: { month: string; netWorth: number; assets: number; liabilities: number }[];
  topHoldings: { name: string; value: number; pnl: number }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  // Fetch all data in parallel
  const [
    accounts,
    holdings,
    debts,
    income,
    expenses,
    settings,
    snapshots,
    holdingsByType,
    ccBalance,
    highestApr,
  ] = await Promise.all([
    getAccounts(),
    getHoldingsWithPrices(),
    getDebtsWithMetrics(),
    getTotalMonthlyIncome(),
    getTotalMonthlyExpenses(),
    getSettings(),
    getNetWorthSnapshots(12),
    getHoldingsByType(),
    getCreditCardBalance(),
    getHighestApr(),
  ]);

  // Calculate total EMI
  const totalEmi = debts.reduce((sum, d) => sum + d.emi, 0);

  // Prepare data for net worth calculation
  const cashAccounts: CashAccount[] = accounts.map((a) => ({ balance: a.balance }));
  const assetItems: AssetItem[] = holdings.map((h) => ({
    type: h.assetType,
    value: h.currentValue,
  }));
  const liabilityItems: LiabilityItem[] = debts.map((d) => ({
    type: d.type,
    balance: d.currentBalance,
  }));

  // Calculate net worth summary
  const netWorthSummary = calculateNetWorthSummary(
    cashAccounts,
    assetItems,
    liabilityItems
  );

  // Prepare data for cashflow calculation
  const incomeItems: IncomeItem[] = [{ amountMonthly: income }];
  const expenseItems: CashflowExpenseItem[] = [{ amountMonthly: expenses, category: "other" }];
  const debtItems: DebtItem[] = debts.map((d) => ({ emi: d.emi }));

  // Calculate cashflow summary
  const cashflowSummary = calculateCashflowSummary(
    incomeItems,
    expenseItems,
    debtItems,
    netWorthSummary.liquidAssets
  );

  // Build rules context and evaluate alerts
  const rulesContext = buildRulesContext({
    income,
    expenses,
    emi: totalEmi,
    liquidAssets: netWorthSummary.liquidAssets,
    totalAssets: netWorthSummary.totalAssets,
    totalLiabilities: netWorthSummary.totalLiabilities,
    ccBalance,
    highestApr,
    assetAllocation: netWorthSummary.assetAllocation,
    settings,
  });

  const alerts = evaluateRules(rulesContext);

  // Format snapshots for chart
  const formattedSnapshots = snapshots.map((s) => ({
    month: new Date(s.asOfMonth).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    netWorth: s.netWorth,
    assets: s.totalAssets,
    liabilities: s.totalLiabilities,
  }));

  // Get top 5 holdings by value
  const topHoldings = [...holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
    .map((h) => ({
      name: h.assetName,
      value: h.currentValue,
      pnl: h.pnl,
    }));

  return {
    netWorth: netWorthSummary,
    cashflow: cashflowSummary,
    alerts,
    snapshots: formattedSnapshots,
    topHoldings,
  };
}

export async function getQuickStats() {
  const [accounts, holdings, debts, income, expenses] = await Promise.all([
    getAccounts(),
    getHoldingsWithPrices(),
    getDebtsWithMetrics(),
    getTotalMonthlyIncome(),
    getTotalMonthlyExpenses(),
  ]);

  const cashTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
  const holdingsTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const debtsTotal = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalEmi = debts.reduce((sum, d) => sum + d.emi, 0);

  return {
    totalAssets: cashTotal + holdingsTotal,
    totalLiabilities: debtsTotal,
    netWorth: cashTotal + holdingsTotal - debtsTotal,
    monthlyIncome: income,
    monthlyExpenses: expenses,
    monthlyEmi: totalEmi,
    freeCashflow: income - expenses - totalEmi,
  };
}
