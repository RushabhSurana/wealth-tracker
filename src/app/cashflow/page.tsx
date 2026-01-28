import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { getActiveIncomeStreams, getTotalMonthlyIncome, getIncomeByType } from "@/lib/actions/income";
import { getActiveExpenseItems, getTotalMonthlyExpenses, getExpensesByCategory } from "@/lib/actions/expenses";
import { getTotalMonthlyEmi } from "@/lib/actions/debts";
import { getAccounts } from "@/lib/actions/accounts";
import { getHoldingsWithPrices } from "@/lib/actions/holdings";
import { calculateLiquidAssets } from "@/lib/calc/networth";
import { calculateRunway, generateMonthlyProjection } from "@/lib/calc/cashflow";
import { formatCurrency, formatPercent, getIncomeTypeLabel, getExpenseCategoryLabel } from "@/lib/utils";
import { IncomeList } from "./income-list";
import { ExpenseList } from "./expense-list";

async function CashflowContent() {
  const [incomeStreams, expenseItems, income, expenses, emi, accounts, holdings] = await Promise.all([
    getActiveIncomeStreams(),
    getActiveExpenseItems(),
    getTotalMonthlyIncome(),
    getTotalMonthlyExpenses(),
    getTotalMonthlyEmi(),
    getAccounts(),
    getHoldingsWithPrices(),
  ]);

  const incomeByType = await getIncomeByType();
  const expensesByCategory = await getExpensesByCategory();

  // Calculate liquid assets for runway
  const cashAccounts = accounts.map(a => ({ balance: a.balance }));
  const liquidTypes = ["equity", "mf", "crypto", "gold"];
  const holdingItems = holdings.map(h => ({ type: h.assetType, value: h.currentValue }));
  const liquidAssets = calculateLiquidAssets(cashAccounts, holdingItems);

  const freeCashflow = income - expenses - emi;
  const savingsRate = income > 0 ? (freeCashflow / income) * 100 : 0;
  const runwayMonths = calculateRunway(liquidAssets, expenses, emi);

  // Generate projection data
  const projectionData = generateMonthlyProjection(income, expenses, emi, 6);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(income)}
          changeType="positive"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(expenses)}
          changeType="neutral"
        />
        <StatCard
          title="Monthly EMIs"
          value={formatCurrency(emi)}
          changeType="negative"
        />
        <StatCard
          title="Free Cashflow"
          value={formatCurrency(freeCashflow)}
          change={`Savings Rate: ${formatPercent(savingsRate)}`}
          changeType={freeCashflow >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Runway Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Financial Runway</h3>
            <p className="text-sm text-gray-500">How long your liquid assets will last</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              {runwayMonths === Infinity ? "∞" : `${runwayMonths.toFixed(1)}`}
            </p>
            <p className="text-sm text-gray-500">months</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${runwayMonths >= 6 ? 'bg-green-500' : runwayMonths >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (runwayMonths / 12) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0</span>
            <span>3 months</span>
            <span>6 months</span>
            <span>12+ months</span>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Projection */}
        <Card>
          <CardHeader title="6-Month Projection" subtitle="Expected income vs expenses" />
          <BarChart
            data={projectionData}
            bars={[
              { key: "income", name: "Income", color: "#10b981" },
              { key: "expenses", name: "Expenses", color: "#f59e0b" },
              { key: "emi", name: "EMI", color: "#ef4444" },
            ]}
            xAxisKey="month"
            height={280}
          />
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader title="Expense Breakdown" subtitle="By category" />
          <DonutChart
            data={expensesByCategory}
            formatterType="expense"
          />
        </Card>
      </div>

      {/* Income & Expense Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Streams */}
        <Card>
          <CardHeader
            title="Income Streams"
            subtitle={`${incomeStreams.length} active streams`}
          />
          <IncomeList incomeStreams={incomeStreams} />
        </Card>

        {/* Expense Items */}
        <Card>
          <CardHeader
            title="Expense Items"
            subtitle={`${expenseItems.length} tracked expenses`}
          />
          <ExpenseList expenseItems={expenseItems} />
        </Card>
      </div>

      {/* Income by Type */}
      {Object.keys(incomeByType).length > 0 && (
        <Card>
          <CardHeader title="Income by Type" subtitle="Monthly breakdown" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(incomeByType).map(([type, amount]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{getIncomeTypeLabel(type)}</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(amount)}</p>
                <p className="text-xs text-gray-400">
                  {((amount / income) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function CashflowPage() {
  return (
    <>
      <PageHeader
        title="Cashflow"
        description="Track your income and expenses"
      />
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-lg" />}>
        <CashflowContent />
      </Suspense>
    </>
  );
}
