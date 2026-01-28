/**
 * Net Worth Calculation Functions
 * All financial calculations are deterministic and tested
 */

import type { AssetType, NetWorthSummary } from "../types";

export interface AssetItem {
  type: AssetType;
  value: number;
}

export interface LiabilityItem {
  type: string;
  balance: number;
}

export interface CashAccount {
  balance: number;
}

// Liquid asset types - can be converted to cash quickly
const LIQUID_ASSET_TYPES: AssetType[] = ["equity", "mf", "crypto", "gold"];

// Short-term debt types (due within 1 year or revolving)
const SHORT_TERM_DEBT_TYPES = ["cc", "personal"];

/**
 * Calculate total assets value
 */
export function calculateTotalAssets(
  cashAccounts: CashAccount[],
  holdings: AssetItem[]
): number {
  const cashTotal = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const holdingsTotal = holdings.reduce((sum, h) => sum + h.value, 0);
  return cashTotal + holdingsTotal;
}

/**
 * Calculate total liabilities
 */
export function calculateTotalLiabilities(liabilities: LiabilityItem[]): number {
  return liabilities.reduce((sum, l) => sum + l.balance, 0);
}

/**
 * Calculate net worth
 */
export function calculateNetWorth(
  totalAssets: number,
  totalLiabilities: number
): number {
  return totalAssets - totalLiabilities;
}

/**
 * Calculate liquid assets (cash + liquid investments)
 */
export function calculateLiquidAssets(
  cashAccounts: CashAccount[],
  holdings: AssetItem[]
): number {
  const cashTotal = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const liquidHoldings = holdings
    .filter((h) => LIQUID_ASSET_TYPES.includes(h.type))
    .reduce((sum, h) => sum + h.value, 0);
  return cashTotal + liquidHoldings;
}

/**
 * Calculate short-term liabilities
 */
export function calculateShortTermLiabilities(
  liabilities: LiabilityItem[]
): number {
  return liabilities
    .filter((l) => SHORT_TERM_DEBT_TYPES.includes(l.type))
    .reduce((sum, l) => sum + l.balance, 0);
}

/**
 * Calculate liquid net worth (liquid assets - short-term debt)
 */
export function calculateLiquidNetWorth(
  liquidAssets: number,
  shortTermLiabilities: number
): number {
  return liquidAssets - shortTermLiabilities;
}

/**
 * Calculate asset allocation percentages by type
 */
export function calculateAssetAllocation(
  cashAccounts: CashAccount[],
  holdings: AssetItem[]
): Record<string, number> {
  const allocation: Record<string, number> = {};

  // Add cash
  const cashTotal = cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  if (cashTotal > 0) {
    allocation["cash"] = cashTotal;
  }

  // Add holdings by type
  for (const holding of holdings) {
    allocation[holding.type] = (allocation[holding.type] || 0) + holding.value;
  }

  // Convert to percentages
  const total = Object.values(allocation).reduce((sum, v) => sum + v, 0);
  if (total === 0) return {};

  const percentages: Record<string, number> = {};
  for (const [type, value] of Object.entries(allocation)) {
    percentages[type] = Math.round((value / total) * 100 * 10) / 10; // 1 decimal place
  }

  return percentages;
}

/**
 * Calculate liability mix percentages by type
 */
export function calculateLiabilityMix(
  liabilities: LiabilityItem[]
): Record<string, number> {
  const mix: Record<string, number> = {};

  for (const liability of liabilities) {
    mix[liability.type] = (mix[liability.type] || 0) + liability.balance;
  }

  // Convert to percentages
  const total = Object.values(mix).reduce((sum, v) => sum + v, 0);
  if (total === 0) return {};

  const percentages: Record<string, number> = {};
  for (const [type, value] of Object.entries(mix)) {
    percentages[type] = Math.round((value / total) * 100 * 10) / 10;
  }

  return percentages;
}

/**
 * Calculate complete net worth summary
 */
export function calculateNetWorthSummary(
  cashAccounts: CashAccount[],
  holdings: AssetItem[],
  liabilities: LiabilityItem[]
): NetWorthSummary {
  const totalAssets = calculateTotalAssets(cashAccounts, holdings);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = calculateNetWorth(totalAssets, totalLiabilities);
  const liquidAssets = calculateLiquidAssets(cashAccounts, holdings);
  const shortTermLiabilities = calculateShortTermLiabilities(liabilities);
  const liquidNetWorth = calculateLiquidNetWorth(
    liquidAssets,
    shortTermLiabilities
  );
  const assetAllocation = calculateAssetAllocation(cashAccounts, holdings);
  const liabilityMix = calculateLiabilityMix(liabilities);

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidAssets,
    liquidNetWorth,
    assetAllocation,
    liabilityMix,
  };
}
