import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { getHoldingsWithPrices, getHoldingsByType } from "@/lib/actions/holdings";
import { getAccounts } from "@/lib/actions/accounts";
import { getAssets } from "@/lib/actions/assets";
import { formatCurrency, formatPercent, getAssetTypeLabel } from "@/lib/utils";
import { HoldingsList } from "./holdings-list";
import { AccountsList } from "./accounts-list";
import { RefreshPricesButton } from "./refresh-prices-button";

async function InvestmentsContent() {
  const [holdings, accounts, assets, holdingsByType] = await Promise.all([
    getHoldingsWithPrices(),
    getAccounts(),
    getAssets(),
    getHoldingsByType(),
  ]);

  const totalCash = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalHoldings = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  // Add cash to allocation for full picture
  const allocationWithCash = { ...holdingsByType };
  if (totalCash > 0) {
    allocationWithCash["cash"] = totalCash;
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portfolio"
          value={formatCurrency(totalCash + totalHoldings)}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          title="Cash Balance"
          value={formatCurrency(totalCash)}
          change={`${accounts.length} accounts`}
          changeType="neutral"
        />
        <StatCard
          title="Investments"
          value={formatCurrency(totalHoldings)}
          change={`${holdings.length} holdings`}
          changeType="neutral"
        />
        <StatCard
          title="Total P&L"
          value={formatCurrency(totalPnl)}
          change={formatPercent(totalPnlPercent)}
          changeType={totalPnl >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Allocation Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Asset Allocation" subtitle="By asset type" />
          <DonutChart
            data={allocationWithCash}
            formatterType="asset"
          />
        </Card>

        {/* P&L by Asset Type */}
        <Card>
          <CardHeader title="P&L by Asset Type" subtitle="Profit/Loss breakdown" />
          <div className="space-y-3">
            {Object.entries(holdingsByType).map(([type, value]) => {
              const typeHoldings = holdings.filter(h => h.assetType === type);
              const typePnl = typeHoldings.reduce((sum, h) => sum + h.pnl, 0);
              const typeCost = typeHoldings.reduce((sum, h) => sum + h.costBasis, 0);
              const typePnlPercent = typeCost > 0 ? (typePnl / typeCost) * 100 : 0;

              return (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{getAssetTypeLabel(type)}</p>
                    <p className="text-sm text-gray-500">
                      Value: {formatCurrency(value)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${typePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(typePnl)}
                    </p>
                    <p className={`text-sm ${typePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(typePnlPercent)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Holdings List */}
      <Card>
        <CardHeader
          title="Holdings"
          subtitle={`${holdings.length} positions`}
          action={<RefreshPricesButton />}
        />
        <HoldingsList holdings={holdings} assets={assets} />
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader
          title="Cash Accounts"
          subtitle={`${accounts.length} accounts`}
        />
        <AccountsList accounts={accounts} />
      </Card>
    </div>
  );
}

export default function InvestmentsPage() {
  return (
    <>
      <PageHeader
        title="Investments"
        description="Track your portfolio and holdings"
      />
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-lg" />}>
        <InvestmentsContent />
      </Suspense>
    </>
  );
}
