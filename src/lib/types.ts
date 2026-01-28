// Type definitions for the Personal Finance Tracker

export type AccountType = "cash" | "bank" | "wallet" | "savings";

export type AssetType =
  | "equity"
  | "mf"
  | "crypto"
  | "gold"
  | "realestate"
  | "vehicle"
  | "custom";

export type DebtType = "home" | "auto" | "personal" | "education" | "cc";

export type IncomeType =
  | "salary"
  | "freelance"
  | "rental"
  | "dividend"
  | "other";

export type ExpenseCategory =
  | "housing"
  | "transport"
  | "food"
  | "utilities"
  | "entertainment"
  | "health"
  | "education"
  | "emi"
  | "other";

export type ExpenseType = "fixed" | "variable";

export type AlertSeverity = "high" | "medium" | "low";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  action: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidAssets: number;
  liquidNetWorth: number;
  assetAllocation: Record<string, number>;
  liabilityMix: Record<string, number>;
}

export interface CashflowSummary {
  totalIncome: number;
  totalExpenses: number;
  totalEmi: number;
  freeCashflow: number;
  savingsRate: number;
  runwayMonths: number;
}

export interface PayoffSimulation {
  strategy: "avalanche" | "snowball";
  extraPayment: number;
  debts: PayoffDebtResult[];
  totalMonths: number;
  totalInterestPaid: number;
  monthsSaved: number;
  interestSaved: number;
}

export interface PayoffDebtResult {
  debtId: string;
  debtName: string;
  payoffMonth: number;
  totalPaid: number;
  totalInterest: number;
  monthlyBreakdown: PayoffMonth[];
}

export interface PayoffMonth {
  month: number;
  balance: number;
  principal: number;
  interest: number;
  payment: number;
}

export interface AllocationTargets {
  equity: number;
  mf: number;
  crypto: number;
  gold: number;
  realestate: number;
  other: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  asOf: Date;
}

export interface HoldingWithPrice {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  symbol: string | null;
  units: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
}

export interface DebtWithMetrics {
  id: string;
  name: string;
  type: DebtType;
  principal: number;
  currentBalance: number;
  apr: number;
  emi: number;
  startDate: Date;
  tenureMonths: number;
  nextDueDate: Date | null;
  monthsRemaining: number;
  totalInterestRemaining: number;
  monthlyInterest: number;
}

// Form schemas
export interface AccountFormData {
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  notes?: string;
}

export interface AssetFormData {
  name: string;
  type: AssetType;
  symbol?: string;
  currency: string;
  notes?: string;
}

export interface HoldingFormData {
  assetId: string;
  accountId?: string;
  units: number;
  avgCost: number;
}

export interface DebtFormData {
  name: string;
  type: DebtType;
  principal: number;
  currentBalance?: number;
  apr: number;
  emi: number;
  startDate: string;
  tenureMonths: number;
  nextDueDate?: string;
  notes?: string;
}

export interface IncomeFormData {
  name: string;
  type: IncomeType;
  amountMonthly: number;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface ExpenseFormData {
  name: string;
  category: ExpenseCategory;
  amountMonthly: number;
  type: ExpenseType;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface SettingsFormData {
  emergencyFundMonthsTarget: number;
  emiToIncomeMaxPercent: number;
  ccUtilizationMaxPercent: number;
  allocationTargets: AllocationTargets;
}

// Export/Import data structure
export interface ExportData {
  version: string;
  exportedAt: string;
  accounts: AccountFormData[];
  assets: (AssetFormData & { id?: string })[];
  holdings: (HoldingFormData & { assetSymbol?: string })[];
  debts: DebtFormData[];
  incomeStreams: IncomeFormData[];
  expenseItems: ExpenseFormData[];
  settings: SettingsFormData;
}
