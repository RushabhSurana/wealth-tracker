"use client";

import { formatCurrency, getExpenseCategoryLabel } from "@/lib/utils";

interface BudgetStatusItem {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isWarning: boolean;
}

interface BudgetStatusProps {
  budgets: BudgetStatusItem[];
}

export function BudgetStatus({ budgets }: BudgetStatusProps) {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No budgets set</p>
        <p className="text-xs">Set budget limits in Settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map((budget) => (
        <div key={budget.category} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {getExpenseCategoryLabel(budget.category)}
            </span>
            <span className={budget.isOverBudget ? "text-red-600" : budget.isWarning ? "text-amber-600" : "text-gray-600 dark:text-gray-400"}>
              {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className={"h-2 rounded-full transition-all " + (budget.isOverBudget ? "bg-red-500" : budget.isWarning ? "bg-amber-500" : "bg-green-500")}
              style={{ width: Math.min(100, budget.percentUsed) + "%" }}
            />
          </div>
          {budget.isOverBudget && (
            <p className="text-xs text-red-600">
              Over budget by {formatCurrency(Math.abs(budget.remaining))}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
