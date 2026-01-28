import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { getDebtsWithMetrics, getTotalDebtBalance, getTotalMonthlyEmi, comparePayoffStrategies } from "@/lib/actions/debts";
import { getTotalMonthlyIncome } from "@/lib/actions/income";
import { calculateDebtToIncomeRatio } from "@/lib/calc/cashflow";
import { estimateMonthlyInterestBurn } from "@/lib/calc/payoff";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { DebtList } from "./debt-list";
import { PayoffSimulator } from "./payoff-simulator";

async function DebtsContent() {
  const [debts, totalDebt, totalEmi, income] = await Promise.all([
    getDebtsWithMetrics(),
    getTotalDebtBalance(),
    getTotalMonthlyEmi(),
    getTotalMonthlyIncome(),
  ]);

  const debtToIncome = calculateDebtToIncomeRatio(totalEmi, income);

  // Calculate monthly interest burn
  const debtData = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.currentBalance,
    apr: d.apr,
    minPayment: d.emi,
  }));
  const monthlyInterest = estimateMonthlyInterestBurn(debtData);

  // Get payoff comparison
  const payoffComparison = await comparePayoffStrategies(0);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Debt"
          value={formatCurrency(totalDebt)}
          changeType="negative"
        />
        <StatCard
          title="Monthly EMI"
          value={formatCurrency(totalEmi)}
          changeType="neutral"
        />
        <StatCard
          title="Debt-to-Income"
          value={`${debtToIncome.toFixed(1)}%`}
          change={debtToIncome > 35 ? "Above recommended 35%" : "Within healthy range"}
          changeType={debtToIncome > 35 ? "negative" : "positive"}
        />
        <StatCard
          title="Monthly Interest"
          value={formatCurrency(monthlyInterest)}
          change="Lost to interest charges"
          changeType="negative"
        />
      </div>

      {/* Payoff Summary */}
      {debts.length > 0 && (
        <Card>
          <CardHeader title="Debt Payoff Overview" subtitle="Compare strategies" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Avalanche Strategy</h4>
              <p className="text-sm text-blue-700 mt-1">Pay highest APR first</p>
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-bold text-blue-900">
                  {payoffComparison.avalanche.totalMonths} months
                </p>
                <p className="text-sm text-blue-700">
                  Interest: {formatCurrency(payoffComparison.avalanche.totalInterestPaid)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Snowball Strategy</h4>
              <p className="text-sm text-green-700 mt-1">Pay smallest balance first</p>
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-bold text-green-900">
                  {payoffComparison.snowball.totalMonths} months
                </p>
                <p className="text-sm text-green-700">
                  Interest: {formatCurrency(payoffComparison.snowball.totalInterestPaid)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Recommendation</h4>
              <p className="text-sm text-gray-700 mt-1">Based on your debts</p>
              <div className="mt-3 space-y-1">
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {payoffComparison.recommendation}
                </p>
                <p className="text-sm text-gray-700">
                  {payoffComparison.interestDifference > 0
                    ? `Saves ${formatCurrency(payoffComparison.interestDifference)} in interest`
                    : "Both strategies are similar"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Debt List */}
      <Card>
        <CardHeader
          title="Your Debts"
          subtitle={`${debts.length} active debts`}
        />
        <DebtList debts={debts} />
      </Card>

      {/* Payoff Simulator */}
      {debts.length > 0 && (
        <Card>
          <CardHeader
            title="Payoff Simulator"
            subtitle="See how extra payments can help"
          />
          <PayoffSimulator initialDebts={debtData} />
        </Card>
      )}
    </div>
  );
}

export default function DebtsPage() {
  return (
    <>
      <PageHeader
        title="Debts"
        description="Track and pay off your debts strategically"
      />
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-lg" />}>
        <DebtsContent />
      </Suspense>
    </>
  );
}
