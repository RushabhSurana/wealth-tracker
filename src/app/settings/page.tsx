import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "./settings-form";
import { ImportExport } from "./import-export";

async function SettingsContent() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      {/* Target Settings */}
      <Card>
        <CardHeader
          title="Financial Targets"
          subtitle="Set your goals and thresholds for alerts"
        />
        <SettingsForm initialSettings={settings} />
      </Card>

      {/* Import/Export */}
      <Card>
        <CardHeader
          title="Data Management"
          subtitle="Import or export your financial data"
        />
        <ImportExport />
      </Card>

      {/* About */}
      <Card>
        <CardHeader title="About" subtitle="WealthTracker v1.0.0" />
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            WealthTracker is a personal finance dashboard that helps you track your
            net worth, investments, debts, and cashflow in one place.
          </p>
          <p>
            All data is stored locally in a SQLite database. No external services
            or accounts required.
          </p>
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Net worth tracking with asset allocation</li>
              <li>Investment portfolio with P&L tracking</li>
              <li>Debt management with payoff simulator</li>
              <li>Cashflow analysis with runway calculation</li>
              <li>Smart financial alerts and recommendations</li>
              <li>Mock price provider with simulated live updates</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure your targets and manage data"
      />
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-lg" />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}
