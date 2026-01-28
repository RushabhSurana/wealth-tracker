import { describe, it, expect } from "vitest";
import {
  calculateTotalAssets,
  calculateTotalLiabilities,
  calculateNetWorth,
  calculateLiquidAssets,
  calculateLiquidNetWorth,
  calculateAssetAllocation,
  calculateNetWorthSummary,
} from "./networth";

describe("Net Worth Calculations", () => {
  describe("calculateTotalAssets", () => {
    it("should calculate total assets from cash and holdings", () => {
      const cashAccounts = [{ balance: 100000 }, { balance: 50000 }];
      const holdings = [
        { type: "equity" as const, value: 200000 },
        { type: "mf" as const, value: 150000 },
      ];

      const total = calculateTotalAssets(cashAccounts, holdings);
      expect(total).toBe(500000);
    });

    it("should return 0 for empty inputs", () => {
      const total = calculateTotalAssets([], []);
      expect(total).toBe(0);
    });
  });

  describe("calculateTotalLiabilities", () => {
    it("should calculate total liabilities", () => {
      const liabilities = [
        { type: "home", balance: 5000000 },
        { type: "cc", balance: 50000 },
      ];

      const total = calculateTotalLiabilities(liabilities);
      expect(total).toBe(5050000);
    });
  });

  describe("calculateNetWorth", () => {
    it("should calculate net worth correctly", () => {
      expect(calculateNetWorth(1000000, 300000)).toBe(700000);
    });

    it("should handle negative net worth", () => {
      expect(calculateNetWorth(100000, 500000)).toBe(-400000);
    });
  });

  describe("calculateLiquidAssets", () => {
    it("should include only liquid asset types", () => {
      const cashAccounts = [{ balance: 100000 }];
      const holdings = [
        { type: "equity" as const, value: 200000 },
        { type: "realestate" as const, value: 5000000 },
        { type: "crypto" as const, value: 50000 },
      ];

      const liquid = calculateLiquidAssets(cashAccounts, holdings);
      // Cash + equity + crypto (not realestate)
      expect(liquid).toBe(350000);
    });
  });

  describe("calculateLiquidNetWorth", () => {
    it("should calculate liquid net worth", () => {
      const result = calculateLiquidNetWorth(500000, 100000);
      expect(result).toBe(400000);
    });
  });

  describe("calculateAssetAllocation", () => {
    it("should calculate allocation percentages", () => {
      const cashAccounts = [{ balance: 100000 }];
      const holdings = [
        { type: "equity" as const, value: 200000 },
        { type: "mf" as const, value: 200000 },
      ];

      const allocation = calculateAssetAllocation(cashAccounts, holdings);

      expect(allocation.cash).toBe(20);
      expect(allocation.equity).toBe(40);
      expect(allocation.mf).toBe(40);
    });

    it("should return empty object for zero total", () => {
      const allocation = calculateAssetAllocation([], []);
      expect(allocation).toEqual({});
    });
  });

  describe("calculateNetWorthSummary", () => {
    it("should return complete summary", () => {
      const cashAccounts = [{ balance: 200000 }];
      const holdings = [
        { type: "equity" as const, value: 300000 },
        { type: "realestate" as const, value: 5000000 },
      ];
      const liabilities = [
        { type: "home", balance: 4000000 },
        { type: "cc", balance: 50000 },
      ];

      const summary = calculateNetWorthSummary(cashAccounts, holdings, liabilities);

      expect(summary.totalAssets).toBe(5500000);
      expect(summary.totalLiabilities).toBe(4050000);
      expect(summary.netWorth).toBe(1450000);
      expect(summary.liquidAssets).toBe(500000); // cash + equity
      expect(summary.assetAllocation).toBeDefined();
      expect(summary.liabilityMix).toBeDefined();
    });
  });
});
