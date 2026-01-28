/**
 * Rules Engine
 * Deterministic logic to generate financial alerts and recommendations
 */

import type { Alert, AlertSeverity, AllocationTargets } from "../types";

export interface RulesContext {
  // Cashflow
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMonthlyEmi: number;
  freeCashflow: number;
  savingsRate: number;

  // Assets
  liquidAssets: number;
  totalAssets: number;
  assetAllocation: Record<string, number>; // percentages

  // Liabilities
  totalLiabilities: number;
  highestDebtApr: number;
  ccBalance: number;
  hasHighAprDebt: boolean; // APR > 15%

  // Settings
  emergencyFundMonthsTarget: number;
  emiToIncomeMaxPercent: number;
  ccUtilizationMaxPercent: number;
  allocationTargets: AllocationTargets;

  // Computed
  runwayMonths: number;
  debtToIncomeRatio: number;
}

type RuleFunction = (ctx: RulesContext) => Alert | null;

/**
 * Rule: Emergency Fund Check
 * Alert if runway is below target
 */
function checkEmergencyFund(ctx: RulesContext): Alert | null {
  if (ctx.runwayMonths >= ctx.emergencyFundMonthsTarget) {
    return null;
  }

  const severity: AlertSeverity =
    ctx.runwayMonths < 3 ? "high" : ctx.runwayMonths < 5 ? "medium" : "low";

  return {
    id: "emergency-fund",
    severity,
    title: "Emergency Fund Low",
    message: `Your emergency fund covers ${ctx.runwayMonths.toFixed(1)} months. Target is ${ctx.emergencyFundMonthsTarget} months.`,
    action:
      severity === "high"
        ? "Prioritize building emergency fund before other investments"
        : "Consider allocating more savings to your emergency fund",
  };
}

/**
 * Rule: Credit Card Utilization Check
 * Alert if CC balance is high relative to income
 */
function checkCreditCardUtilization(ctx: RulesContext): Alert | null {
  if (ctx.ccBalance === 0 || ctx.totalMonthlyIncome === 0) {
    return null;
  }

  const utilizationPercent = (ctx.ccBalance / ctx.totalMonthlyIncome) * 100;

  if (utilizationPercent <= ctx.ccUtilizationMaxPercent) {
    return null;
  }

  const severity: AlertSeverity =
    utilizationPercent > 100 ? "high" : utilizationPercent > 50 ? "medium" : "low";

  return {
    id: "cc-utilization",
    severity,
    title: "High Credit Card Balance",
    message: `Credit card balance is ${utilizationPercent.toFixed(0)}% of monthly income. Consider paying down to below ${ctx.ccUtilizationMaxPercent}%.`,
    action: "Pay off credit card balance to avoid high interest charges",
  };
}

/**
 * Rule: EMI to Income Ratio Check
 * Alert if EMIs exceed recommended percentage of income
 */
function checkEmiToIncome(ctx: RulesContext): Alert | null {
  if (ctx.totalMonthlyIncome === 0) {
    return null;
  }

  const emiPercent = (ctx.totalMonthlyEmi / ctx.totalMonthlyIncome) * 100;

  if (emiPercent <= ctx.emiToIncomeMaxPercent) {
    return null;
  }

  const severity: AlertSeverity =
    emiPercent > 50 ? "high" : emiPercent > 40 ? "medium" : "low";

  return {
    id: "emi-income-ratio",
    severity,
    title: "High EMI Burden",
    message: `EMIs consume ${emiPercent.toFixed(1)}% of income (recommended: <${ctx.emiToIncomeMaxPercent}%).`,
    action:
      severity === "high"
        ? "Consider debt consolidation or refinancing options"
        : "Avoid taking on new debt until EMI ratio improves",
  };
}

/**
 * Rule: High APR Debt While Investing
 * Alert if user has high interest debt but also liquid investments
 */
function checkHighAprDebtWithInvestments(ctx: RulesContext): Alert | null {
  if (!ctx.hasHighAprDebt) {
    return null;
  }

  // Check if they have significant liquid investments (excluding emergency fund)
  const investmentValue =
    ctx.liquidAssets -
    ctx.emergencyFundMonthsTarget *
      (ctx.totalMonthlyExpenses + ctx.totalMonthlyEmi);

  if (investmentValue <= 0) {
    return null;
  }

  return {
    id: "high-apr-with-investments",
    severity: "medium",
    title: "High Interest Debt Coexists with Investments",
    message: `You have debt at ${ctx.highestDebtApr.toFixed(1)}% APR while holding investments. Debt interest likely exceeds investment returns.`,
    action:
      "Consider using liquid investments to pay off high-interest debt first",
  };
}

/**
 * Rule: Negative Cashflow
 * Alert if monthly expenses exceed income
 */
function checkNegativeCashflow(ctx: RulesContext): Alert | null {
  if (ctx.freeCashflow >= 0) {
    return null;
  }

  return {
    id: "negative-cashflow",
    severity: "high",
    title: "Negative Monthly Cashflow",
    message: `You're spending ₹${Math.abs(ctx.freeCashflow).toLocaleString()} more than you earn each month.`,
    action: "Review and reduce discretionary expenses immediately",
  };
}

/**
 * Rule: Low Savings Rate
 * Alert if savings rate is below healthy threshold
 */
function checkSavingsRate(ctx: RulesContext): Alert | null {
  if (ctx.savingsRate >= 20) {
    return null;
  }

  if (ctx.savingsRate < 0) {
    // Covered by negative cashflow rule
    return null;
  }

  const severity: AlertSeverity =
    ctx.savingsRate < 5 ? "medium" : ctx.savingsRate < 10 ? "low" : "low";

  return {
    id: "low-savings-rate",
    severity,
    title: "Low Savings Rate",
    message: `Your savings rate is ${ctx.savingsRate.toFixed(1)}%. Target at least 20% for long-term wealth building.`,
    action: "Look for ways to increase income or reduce fixed expenses",
  };
}

/**
 * Rule: Asset Allocation Drift
 * Alert if any asset class drifts more than 10% from target
 */
function checkAllocationDrift(ctx: RulesContext): Alert | null {
  const driftThreshold = 10; // percentage points
  const drifts: { type: string; actual: number; target: number; diff: number }[] = [];

  for (const [type, target] of Object.entries(ctx.allocationTargets)) {
    const actual = ctx.assetAllocation[type] || 0;
    const diff = actual - target;

    if (Math.abs(diff) > driftThreshold) {
      drifts.push({ type, actual, target, diff });
    }
  }

  if (drifts.length === 0) {
    return null;
  }

  // Sort by absolute drift
  drifts.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const topDrift = drifts[0];

  const direction = topDrift.diff > 0 ? "overweight" : "underweight";

  return {
    id: "allocation-drift",
    severity: "low",
    title: "Portfolio Allocation Drift",
    message: `${topDrift.type.toUpperCase()} is ${direction} by ${Math.abs(topDrift.diff).toFixed(1)}% (actual: ${topDrift.actual.toFixed(1)}%, target: ${topDrift.target}%).`,
    action:
      topDrift.diff > 0
        ? `Consider rebalancing: reduce ${topDrift.type} allocation`
        : `Consider rebalancing: increase ${topDrift.type} allocation`,
  };
}

/**
 * Rule: No Income Streams
 * Alert if no income is tracked
 */
function checkNoIncome(ctx: RulesContext): Alert | null {
  if (ctx.totalMonthlyIncome > 0) {
    return null;
  }

  return {
    id: "no-income",
    severity: "medium",
    title: "No Income Tracked",
    message: "No income streams are recorded. Add your income sources for accurate financial tracking.",
    action: "Go to Cashflow page and add your income streams",
  };
}

/**
 * Rule: High Net Worth with No Will
 * This is a placeholder for future features
 */

// All rules
const RULES: RuleFunction[] = [
  checkEmergencyFund,
  checkCreditCardUtilization,
  checkEmiToIncome,
  checkHighAprDebtWithInvestments,
  checkNegativeCashflow,
  checkSavingsRate,
  checkAllocationDrift,
  checkNoIncome,
];

/**
 * Run all rules and return alerts
 */
export function evaluateRules(ctx: RulesContext): Alert[] {
  const alerts: Alert[] = [];

  for (const rule of RULES) {
    try {
      const alert = rule(ctx);
      if (alert) {
        alerts.push(alert);
      }
    } catch (error) {
      console.error("Error evaluating rule:", error);
    }
  }

  // Sort by severity (high first)
  const severityOrder: Record<AlertSeverity, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Build rules context from financial data
 */
export function buildRulesContext(data: {
  income: number;
  expenses: number;
  emi: number;
  liquidAssets: number;
  totalAssets: number;
  totalLiabilities: number;
  ccBalance: number;
  highestApr: number;
  assetAllocation: Record<string, number>;
  settings: {
    emergencyFundMonthsTarget: number;
    emiToIncomeMaxPercent: number;
    ccUtilizationMaxPercent: number;
    allocationTargets: AllocationTargets;
  };
}): RulesContext {
  const monthlyBurn = data.expenses + data.emi;
  const runwayMonths = monthlyBurn > 0 ? data.liquidAssets / monthlyBurn : Infinity;
  const freeCashflow = data.income - data.expenses - data.emi;
  const savingsRate = data.income > 0 ? (freeCashflow / data.income) * 100 : 0;
  const debtToIncomeRatio =
    data.income > 0 ? (data.emi / data.income) * 100 : 0;

  return {
    totalMonthlyIncome: data.income,
    totalMonthlyExpenses: data.expenses,
    totalMonthlyEmi: data.emi,
    freeCashflow,
    savingsRate,
    liquidAssets: data.liquidAssets,
    totalAssets: data.totalAssets,
    assetAllocation: data.assetAllocation,
    totalLiabilities: data.totalLiabilities,
    highestDebtApr: data.highestApr,
    ccBalance: data.ccBalance,
    hasHighAprDebt: data.highestApr > 0.15, // 15%
    emergencyFundMonthsTarget: data.settings.emergencyFundMonthsTarget,
    emiToIncomeMaxPercent: data.settings.emiToIncomeMaxPercent,
    ccUtilizationMaxPercent: data.settings.ccUtilizationMaxPercent,
    allocationTargets: data.settings.allocationTargets,
    runwayMonths,
    debtToIncomeRatio,
  };
}
