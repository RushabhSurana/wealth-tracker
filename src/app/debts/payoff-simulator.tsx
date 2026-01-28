"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/charts/bar-chart";
import { simulatePayoff, compareStrategies, type DebtForPayoff } from "@/lib/calc/payoff";
import { formatCurrency } from "@/lib/utils";

interface PayoffSimulatorProps {
  initialDebts: DebtForPayoff[];
}

export function PayoffSimulator({ initialDebts }: PayoffSimulatorProps) {
  const [extraPayment, setExtraPayment] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState<"avalanche" | "snowball">("avalanche");

  const comparison = useMemo(() => {
    return compareStrategies(initialDebts, extraPayment);
  }, [initialDebts, extraPayment]);

  const simulation = useMemo(() => {
    return simulatePayoff(initialDebts, selectedStrategy, extraPayment);
  }, [initialDebts, selectedStrategy, extraPayment]);

  // Generate chart data showing balance over time
  const chartData = useMemo(() => {
    if (simulation.debts.length === 0) return [];

    // Find max months across all debts
    const maxMonths = Math.max(...simulation.debts.map(d => d.payoffMonth));

    // Create data points for every 3 months
    const data = [];
    for (let month = 0; month <= maxMonths; month += 3) {
      const dataPoint: Record<string, string | number> = { month: `M${month}` };

      for (const debt of simulation.debts) {
        const breakdown = debt.monthlyBreakdown.find(b => b.month === month);
        if (breakdown) {
          dataPoint[debt.debtName] = breakdown.balance;
        } else if (month > debt.payoffMonth) {
          dataPoint[debt.debtName] = 0;
        }
      }

      data.push(dataPoint);
    }

    return data;
  }, [simulation]);

  const chartBars = simulation.debts.map((debt, index) => ({
    key: debt.debtName,
    name: debt.debtName,
    stackId: "stack",
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="w-full sm:w-48">
          <Input
            label="Extra Monthly Payment"
            type="number"
            value={extraPayment || ""}
            onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
            min={0}
            step={1000}
            placeholder="0"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedStrategy === "avalanche" ? "primary" : "secondary"}
            onClick={() => setSelectedStrategy("avalanche")}
            size="sm"
          >
            Avalanche
          </Button>
          <Button
            variant={selectedStrategy === "snowball" ? "primary" : "secondary"}
            onClick={() => setSelectedStrategy("snowball")}
            size="sm"
          >
            Snowball
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Payoff Time</p>
          <p className="text-2xl font-bold text-gray-900">{simulation.totalMonths} months</p>
          {simulation.monthsSaved > 0 && (
            <p className="text-sm text-green-600">
              {simulation.monthsSaved} months saved
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Interest</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(simulation.totalInterestPaid)}
          </p>
          {simulation.interestSaved > 0 && (
            <p className="text-sm text-green-600">
              {formatCurrency(simulation.interestSaved)} saved
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Monthly Payment</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              initialDebts.reduce((sum, d) => sum + d.minPayment, 0) + extraPayment
            )}
          </p>
          <p className="text-sm text-gray-500">
            Base: {formatCurrency(initialDebts.reduce((sum, d) => sum + d.minPayment, 0))}
          </p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Strategy</p>
          <p className="text-2xl font-bold text-gray-900 capitalize">{selectedStrategy}</p>
          <p className="text-sm text-gray-500">
            {selectedStrategy === "avalanche" ? "Highest APR first" : "Lowest balance first"}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Debt Balance Over Time</h4>
          <BarChart
            data={chartData}
            bars={chartBars}
            xAxisKey="month"
            height={300}
            stacked
          />
        </div>
      )}

      {/* Payoff Order */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Payoff Order</h4>
        <div className="space-y-2">
          {simulation.debts
            .sort((a, b) => a.payoffMonth - b.payoffMonth)
            .map((debt, index) => (
              <div
                key={debt.debtId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{debt.debtName}</p>
                    <p className="text-sm text-gray-500">
                      Paid off in month {debt.payoffMonth}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(debt.totalPaid)}</p>
                  <p className="text-sm text-gray-500">
                    Interest: {formatCurrency(debt.totalInterest)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Comparison Table */}
      {extraPayment > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Impact of Extra Payment</h4>
          <p className="text-sm text-green-700">
            By paying an extra {formatCurrency(extraPayment)} per month, you will:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-green-700">
            <li>• Be debt-free {simulation.monthsSaved} months earlier</li>
            <li>• Save {formatCurrency(simulation.interestSaved)} in interest</li>
            <li>
              • Pay a total of{" "}
              {formatCurrency(
                simulation.debts.reduce((sum, d) => sum + d.totalPaid, 0)
              )}{" "}
              instead of{" "}
              {formatCurrency(
                simulation.debts.reduce((sum, d) => sum + d.totalPaid, 0) +
                  simulation.interestSaved
              )}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
