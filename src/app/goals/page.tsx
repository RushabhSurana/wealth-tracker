import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, StatCard } from "@/components/ui/card";
import { getGoals, getGoalsSummary } from "@/lib/actions/goals";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { GoalList } from "./goal-list";

const categoryLabels: Record<string, string> = {
  emergency: "Emergency Fund",
  retirement: "Retirement",
  house: "House",
  car: "Car",
  vacation: "Vacation",
  education: "Education",
  other: "Other",
};

async function GoalsContent() {
  const [goals, summary] = await Promise.all([
    getGoals(),
    getGoalsSummary(),
  ]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Goals"
          value={summary.activeGoals.toString()}
          changeType="neutral"
        />
        <StatCard
          title="Total Target"
          value={formatCurrency(summary.totalTarget)}
          changeType="neutral"
        />
        <StatCard
          title="Total Saved"
          value={formatCurrency(summary.totalSaved)}
          changeType="positive"
        />
        <StatCard
          title="Overall Progress"
          value={formatPercent(summary.overallProgress)}
          changeType={summary.overallProgress >= 50 ? "positive" : "neutral"}
        />
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader
          title="Savings Goals"
          subtitle="Track your progress towards financial targets"
        />
        <GoalList goals={goals} categoryLabels={categoryLabels} />
      </Card>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <>
      <PageHeader
        title="Savings Goals"
        description="Track and achieve your financial goals"
      />
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-lg" />}>
        <GoalsContent />
      </Suspense>
    </>
  );
}
