import { describe, it, expect } from "vitest";
import {
  calculateMonthlyInterest,
  sortForAvalanche,
  sortForSnowball,
  simulatePayoff,
  compareStrategies,
  calculateDebtMetrics,
  estimateMonthlyInterestBurn,
} from "./payoff";
import type { DebtForPayoff } from "./payoff";

describe("Payoff Calculations", () => {
  const sampleDebts: DebtForPayoff[] = [
    { id: "1", name: "Credit Card", balance: 50000, apr: 0.42, minPayment: 5000 },
    { id: "2", name: "Personal Loan", balance: 200000, apr: 0.14, minPayment: 8000 },
    { id: "3", name: "Home Loan", balance: 5000000, apr: 0.085, minPayment: 50000 },
  ];

  describe("calculateMonthlyInterest", () => {
    it("should calculate monthly interest correctly", () => {
      // 12% APR on 100000 = 1000/month
      const interest = calculateMonthlyInterest(100000, 0.12);
      expect(interest).toBe(1000);
    });

    it("should handle zero balance", () => {
      expect(calculateMonthlyInterest(0, 0.12)).toBe(0);
    });
  });

  describe("sortForAvalanche", () => {
    it("should sort by APR descending", () => {
      const sorted = sortForAvalanche(sampleDebts);
      expect(sorted[0].name).toBe("Credit Card"); // 42% APR
      expect(sorted[1].name).toBe("Personal Loan"); // 14% APR
      expect(sorted[2].name).toBe("Home Loan"); // 8.5% APR
    });
  });

  describe("sortForSnowball", () => {
    it("should sort by balance ascending", () => {
      const sorted = sortForSnowball(sampleDebts);
      expect(sorted[0].name).toBe("Credit Card"); // 50000
      expect(sorted[1].name).toBe("Personal Loan"); // 200000
      expect(sorted[2].name).toBe("Home Loan"); // 5000000
    });
  });

  describe("simulatePayoff", () => {
    it("should return results for avalanche strategy", () => {
      const result = simulatePayoff(sampleDebts, "avalanche", 0);

      expect(result.strategy).toBe("avalanche");
      expect(result.debts.length).toBe(3);
      expect(result.totalMonths).toBeGreaterThan(0);
      expect(result.totalInterestPaid).toBeGreaterThan(0);
    });

    it("should return results for snowball strategy", () => {
      const result = simulatePayoff(sampleDebts, "snowball", 0);

      expect(result.strategy).toBe("snowball");
      expect(result.debts.length).toBe(3);
    });

    it("should reduce interest with extra payment", () => {
      const withoutExtra = simulatePayoff(sampleDebts, "avalanche", 0);
      const withExtra = simulatePayoff(sampleDebts, "avalanche", 10000);

      // Extra payments should save interest
      expect(withExtra.interestSaved).toBeGreaterThanOrEqual(0);
      expect(withExtra.totalInterestPaid).toBeLessThanOrEqual(withoutExtra.totalInterestPaid);
    });

    it("should handle empty debt array", () => {
      const result = simulatePayoff([], "avalanche", 0);

      expect(result.debts).toEqual([]);
      expect(result.totalMonths).toBe(0);
      expect(result.totalInterestPaid).toBe(0);
    });
  });

  describe("compareStrategies", () => {
    it("should compare avalanche and snowball", () => {
      const comparison = compareStrategies(sampleDebts, 0);

      expect(comparison.avalanche).toBeDefined();
      expect(comparison.snowball).toBeDefined();
      expect(comparison.recommendation).toBeDefined();
      expect(["avalanche", "snowball"]).toContain(comparison.recommendation);
    });

    it("should show avalanche saves more interest for high APR debt", () => {
      const comparison = compareStrategies(sampleDebts, 10000);

      // Avalanche should typically save more interest
      expect(comparison.avalanche.totalInterestPaid).toBeLessThanOrEqual(
        comparison.snowball.totalInterestPaid
      );
    });
  });

  describe("calculateDebtMetrics", () => {
    it("should calculate aggregate debt metrics", () => {
      const metrics = calculateDebtMetrics(sampleDebts);

      expect(metrics.totalDebt).toBe(5250000);
      expect(metrics.totalMonthlyEmi).toBe(63000);
      expect(metrics.highestApr).toBe(0.42);
      expect(metrics.lowestBalance).toBe(50000);
      expect(metrics.weightedAvgApr).toBeGreaterThan(0);
    });

    it("should handle empty array", () => {
      const metrics = calculateDebtMetrics([]);

      expect(metrics.totalDebt).toBe(0);
      expect(metrics.totalMonthlyEmi).toBe(0);
    });
  });

  describe("estimateMonthlyInterestBurn", () => {
    it("should estimate total monthly interest", () => {
      const monthlyInterest = estimateMonthlyInterestBurn(sampleDebts);

      // Credit card: 50000 * 0.42 / 12 = 1750
      // Personal: 200000 * 0.14 / 12 = 2333.33
      // Home: 5000000 * 0.085 / 12 = 35416.67
      // Total ~= 39500
      expect(monthlyInterest).toBeGreaterThan(35000);
      expect(monthlyInterest).toBeLessThan(45000);
    });
  });
});
