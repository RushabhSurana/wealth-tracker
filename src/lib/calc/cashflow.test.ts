import { describe, it, expect } from "vitest";
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalEmi,
  calculateFreeCashflow,
  calculateSavingsRate,
  calculateRunway,
  calculateDebtToIncomeRatio,
  calculateCashflowSummary,
} from "./cashflow";

describe("Cashflow Calculations", () => {
  describe("calculateTotalIncome", () => {
    it("should sum all income streams", () => {
      const incomes = [
        { amountMonthly: 150000 },
        { amountMonthly: 25000 },
        { amountMonthly: 5000 },
      ];

      expect(calculateTotalIncome(incomes)).toBe(180000);
    });

    it("should return 0 for empty array", () => {
      expect(calculateTotalIncome([])).toBe(0);
    });
  });

  describe("calculateTotalExpenses", () => {
    it("should exclude EMI category from total", () => {
      const expenses = [
        { amountMonthly: 20000, category: "housing" },
        { amountMonthly: 15000, category: "food" },
        { amountMonthly: 50000, category: "emi" }, // Should be excluded
      ];

      expect(calculateTotalExpenses(expenses)).toBe(35000);
    });
  });

  describe("calculateTotalEmi", () => {
    it("should sum all EMIs", () => {
      const debts = [{ emi: 50000 }, { emi: 20000 }, { emi: 10000 }];

      expect(calculateTotalEmi(debts)).toBe(80000);
    });
  });

  describe("calculateFreeCashflow", () => {
    it("should calculate income minus expenses minus EMI", () => {
      const result = calculateFreeCashflow(200000, 50000, 80000);
      expect(result).toBe(70000);
    });

    it("should handle negative cashflow", () => {
      const result = calculateFreeCashflow(100000, 60000, 80000);
      expect(result).toBe(-40000);
    });
  });

  describe("calculateSavingsRate", () => {
    it("should calculate savings rate as percentage", () => {
      const rate = calculateSavingsRate(50000, 200000);
      expect(rate).toBe(25);
    });

    it("should return 0 for zero income", () => {
      expect(calculateSavingsRate(50000, 0)).toBe(0);
    });

    it("should handle negative savings rate", () => {
      const rate = calculateSavingsRate(-20000, 100000);
      expect(rate).toBe(-20);
    });
  });

  describe("calculateRunway", () => {
    it("should calculate months of runway", () => {
      const runway = calculateRunway(600000, 50000, 50000);
      expect(runway).toBe(6);
    });

    it("should return Infinity for zero burn", () => {
      expect(calculateRunway(500000, 0, 0)).toBe(Infinity);
    });

    it("should round to 1 decimal place", () => {
      const runway = calculateRunway(500000, 45000, 25000);
      expect(runway).toBeCloseTo(7.1, 1);
    });
  });

  describe("calculateDebtToIncomeRatio", () => {
    it("should calculate ratio as percentage", () => {
      const ratio = calculateDebtToIncomeRatio(70000, 200000);
      expect(ratio).toBe(35);
    });

    it("should return 0 for zero income", () => {
      expect(calculateDebtToIncomeRatio(50000, 0)).toBe(0);
    });
  });

  describe("calculateCashflowSummary", () => {
    it("should return complete cashflow summary", () => {
      const incomes = [{ amountMonthly: 200000 }];
      const expenses = [{ amountMonthly: 50000, category: "housing" }];
      const debts = [{ emi: 80000 }];
      const liquidAssets = 600000;

      const summary = calculateCashflowSummary(incomes, expenses, debts, liquidAssets);

      expect(summary.totalIncome).toBe(200000);
      expect(summary.totalExpenses).toBe(50000);
      expect(summary.totalEmi).toBe(80000);
      expect(summary.freeCashflow).toBe(70000);
      expect(summary.savingsRate).toBe(35);
      expect(summary.runwayMonths).toBeCloseTo(4.6, 1);
    });
  });
});
