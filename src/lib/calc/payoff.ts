/**
 * Debt Payoff Simulator
 * Implements Avalanche and Snowball strategies with extra payment support
 */

import type { PayoffSimulation, PayoffDebtResult, PayoffMonth } from "../types";

export interface DebtForPayoff {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number; // EMI
}

/**
 * Calculate monthly interest for a debt
 */
export function calculateMonthlyInterest(balance: number, apr: number): number {
  const monthlyRate = apr / 12;
  return balance * monthlyRate;
}

/**
 * Sort debts for Avalanche strategy (highest APR first)
 */
export function sortForAvalanche(debts: DebtForPayoff[]): DebtForPayoff[] {
  return [...debts].sort((a, b) => b.apr - a.apr);
}

/**
 * Sort debts for Snowball strategy (lowest balance first)
 */
export function sortForSnowball(debts: DebtForPayoff[]): DebtForPayoff[] {
  return [...debts].sort((a, b) => a.balance - b.balance);
}

/**
 * Simulate payoff for a single debt with given monthly payment
 */
function simulateDebtPayoff(
  debt: DebtForPayoff,
  monthlyPayment: number,
  startMonth: number = 1
): PayoffDebtResult {
  const monthlyBreakdown: PayoffMonth[] = [];
  let balance = debt.balance;
  let totalPaid = 0;
  let totalInterest = 0;
  let month = startMonth;

  // Safety limit to prevent infinite loops
  const maxMonths = 600; // 50 years max

  while (balance > 0.01 && month - startMonth < maxMonths) {
    const interest = calculateMonthlyInterest(balance, debt.apr);
    const payment = Math.min(monthlyPayment, balance + interest);
    const principal = payment - interest;

    balance = Math.max(0, balance - principal);
    totalPaid += payment;
    totalInterest += interest;

    monthlyBreakdown.push({
      month,
      balance: Math.round(balance * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      payment: Math.round(payment * 100) / 100,
    });

    month++;
  }

  return {
    debtId: debt.id,
    debtName: debt.name,
    payoffMonth: month - 1,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    monthlyBreakdown,
  };
}

/**
 * Run the debt payoff simulation with a given strategy
 */
export function simulatePayoff(
  debts: DebtForPayoff[],
  strategy: "avalanche" | "snowball",
  extraMonthlyPayment: number = 0
): PayoffSimulation {
  if (debts.length === 0) {
    return {
      strategy,
      extraPayment: extraMonthlyPayment,
      debts: [],
      totalMonths: 0,
      totalInterestPaid: 0,
      monthsSaved: 0,
      interestSaved: 0,
    };
  }

  // Sort debts according to strategy
  const sortedDebts =
    strategy === "avalanche" ? sortForAvalanche(debts) : sortForSnowball(debts);

  // Track remaining debts and results
  const remainingDebts = sortedDebts.map((d) => ({
    ...d,
    currentBalance: d.balance,
    paid: false,
  }));

  const results: PayoffDebtResult[] = [];
  let currentMonth = 1;
  let totalInterestPaid = 0;
  const maxMonths = 600;

  // Calculate total minimum payments
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  let availableExtra = extraMonthlyPayment;

  // Process month by month
  while (
    remainingDebts.some((d) => !d.paid && d.currentBalance > 0.01) &&
    currentMonth < maxMonths
  ) {
    // Calculate freed up payments from paid-off debts
    const freedPayments = remainingDebts
      .filter((d) => d.paid)
      .reduce((sum, d) => sum + d.minPayment, 0);

    // Total extra available this month
    const totalExtra = availableExtra + freedPayments;

    // Apply payments to each debt
    for (const debt of remainingDebts) {
      if (debt.paid || debt.currentBalance <= 0.01) continue;

      // Calculate interest
      const interest = calculateMonthlyInterest(debt.currentBalance, debt.apr);
      totalInterestPaid += interest;

      // Determine payment for this debt
      let payment = debt.minPayment;

      // If this is the priority debt (first unpaid), add extra
      const priorityDebt = remainingDebts.find(
        (d) => !d.paid && d.currentBalance > 0.01
      );
      if (debt.id === priorityDebt?.id) {
        payment += totalExtra;
      }

      // Cap payment at remaining balance + interest
      payment = Math.min(payment, debt.currentBalance + interest);

      // Apply payment
      const principal = payment - interest;
      debt.currentBalance = Math.max(0, debt.currentBalance - principal);

      // Check if paid off
      if (debt.currentBalance <= 0.01) {
        debt.paid = true;
        debt.currentBalance = 0;
      }
    }

    currentMonth++;
  }

  // Generate results for each debt
  for (const debt of sortedDebts) {
    const result = simulateDebtPayoff(
      debt,
      debt.minPayment + (sortedDebts[0].id === debt.id ? extraMonthlyPayment : 0)
    );
    results.push(result);
  }

  // Calculate baseline (minimum payments only) for comparison
  const baselineSimulation = simulatePayoffBaseline(debts);

  // Calculate final totals
  const lastPayoffMonth = Math.max(...results.map((r) => r.payoffMonth));
  const totalMonths = lastPayoffMonth;

  return {
    strategy,
    extraPayment: extraMonthlyPayment,
    debts: results,
    totalMonths,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    monthsSaved: Math.max(0, baselineSimulation.totalMonths - totalMonths),
    interestSaved: Math.max(
      0,
      Math.round(
        (baselineSimulation.totalInterestPaid - totalInterestPaid) * 100
      ) / 100
    ),
  };
}

/**
 * Calculate baseline payoff (minimum payments only)
 */
function simulatePayoffBaseline(debts: DebtForPayoff[]): {
  totalMonths: number;
  totalInterestPaid: number;
} {
  let totalInterest = 0;
  let maxMonths = 0;

  for (const debt of debts) {
    let balance = debt.balance;
    let months = 0;

    while (balance > 0.01 && months < 600) {
      const interest = calculateMonthlyInterest(balance, debt.apr);
      totalInterest += interest;

      const payment = Math.min(debt.minPayment, balance + interest);
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      months++;
    }

    maxMonths = Math.max(maxMonths, months);
  }

  return {
    totalMonths: maxMonths,
    totalInterestPaid: Math.round(totalInterest * 100) / 100,
  };
}

/**
 * Compare Avalanche vs Snowball strategies
 */
export function compareStrategies(
  debts: DebtForPayoff[],
  extraMonthlyPayment: number = 0
): {
  avalanche: PayoffSimulation;
  snowball: PayoffSimulation;
  recommendation: "avalanche" | "snowball";
  interestDifference: number;
} {
  const avalanche = simulatePayoff(debts, "avalanche", extraMonthlyPayment);
  const snowball = simulatePayoff(debts, "snowball", extraMonthlyPayment);

  const interestDifference = snowball.totalInterestPaid - avalanche.totalInterestPaid;

  // Recommend avalanche if it saves significant interest, otherwise snowball for psychology
  const recommendation =
    interestDifference > 1000 ? "avalanche" : "snowball";

  return {
    avalanche,
    snowball,
    recommendation,
    interestDifference: Math.round(interestDifference * 100) / 100,
  };
}

/**
 * Calculate total debt metrics
 */
export function calculateDebtMetrics(debts: DebtForPayoff[]): {
  totalDebt: number;
  totalMonthlyEmi: number;
  weightedAvgApr: number;
  highestApr: number;
  lowestBalance: number;
} {
  if (debts.length === 0) {
    return {
      totalDebt: 0,
      totalMonthlyEmi: 0,
      weightedAvgApr: 0,
      highestApr: 0,
      lowestBalance: 0,
    };
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMonthlyEmi = debts.reduce((sum, d) => sum + d.minPayment, 0);

  // Weighted average APR
  const weightedApr =
    debts.reduce((sum, d) => sum + d.apr * d.balance, 0) / totalDebt;

  return {
    totalDebt: Math.round(totalDebt * 100) / 100,
    totalMonthlyEmi: Math.round(totalMonthlyEmi * 100) / 100,
    weightedAvgApr: Math.round(weightedApr * 10000) / 10000,
    highestApr: Math.max(...debts.map((d) => d.apr)),
    lowestBalance: Math.min(...debts.map((d) => d.balance)),
  };
}

/**
 * Estimate monthly interest burn across all debts
 */
export function estimateMonthlyInterestBurn(debts: DebtForPayoff[]): number {
  return debts.reduce((sum, d) => {
    return sum + calculateMonthlyInterest(d.balance, d.apr);
  }, 0);
}
