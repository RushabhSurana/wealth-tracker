import { Suspense } from "react";
import { getDashboardData } from "@/lib/actions/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { AlertList } from "@/components/ui/alert-banner";
import { DonutChart } from "@/components/charts/donut-chart";
import { LineChart } from "@/components/charts/line-chart";
import { formatCurrency, formatPercent, getAssetTypeLabel, getDebtTypeLabel } from "@/lib/utils";

function LoadingCard() {
  return (
    <Card>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </Card>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Net Worth Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(data.netWorth.netWorth)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Assets"
          value={formatCurrency(data.netWorth.totalAssets)}
          changeType="positive"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          title="Total Liabilities"
          value={formatCurrency(data.netWorth.totalLiabilities)}
          changeType="negative"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <StatCard
          title="Liquid Net Worth"
          value={formatCurrency(data.netWorth.liquidNetWorth)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Cashflow Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(data.cashflow.totalIncome)}
          changeType="positive"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(data.cashflow.totalExpenses + data.cashflow.totalEmi)}
          changeType="negative"
        />
        <StatCard
          title="Free Cashflow"
          value={formatCurrency(data.cashflow.freeCashflow)}
          change={`Savings Rate: ${formatPercent(data.cashflow.savingsRate)}`}
          changeType={data.cashflow.freeCashflow >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Runway"
          value={`${data.cashflow.runwayMonths.toFixed(1)} months`}
          change="Based on current burn rate"
          changeType={data.cashflow.runwayMonths >= 6 ? "positive" : "negative"}
        />
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader title="Financial Alerts" subtitle="Action items for your finances" />
          <AlertList alerts={data.alerts} maxDisplay={4} />
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <Card>
          <CardHeader title="Net Worth Trend" subtitle="Last 12 months" />
          <LineChart
            data={data.snapshots}
            lines={[
              { key: "netWorth", name: "Net Worth", color: "#3b82f6" },
              { key: "assets", name: "Assets", color: "#10b981" },
              { key: "liabilities", name: "Liabilities", color: "#ef4444" },
            ]}
            xAxisKey="month"
            height={280}
          />
        </Card>

        {/* Asset Allocation */}
        <Card>
          <CardHeader title="Asset Allocation" subtitle="By asset type" />
          <DonutChart
            data={data.netWorth.assetAllocation}
            formatterType="asset"
          />
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Holdings */}
        <Card>
          <CardHeader title="Top Holdings" subtitle="By current value" />
          <div className="space-y-3">
            {data.topHoldings.map((holding, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{holding.name}</p>
                  <p className={`text-sm ${holding.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    P&L: {formatCurrency(holding.pnl)} ({formatPercent((holding.pnl / (holding.value - holding.pnl)) * 100)})
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(holding.value)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Liability Mix */}
        {Object.keys(data.netWorth.liabilityMix).length > 0 && (
          <Card>
            <CardHeader title="Liability Mix" subtitle="By debt type" />
            <DonutChart
              data={data.netWorth.liabilityMix}
              formatterType="debt"
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your personal finance overview"
      />
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </>
  );
}
