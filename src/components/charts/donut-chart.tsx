"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency, CHART_COLORS, getAssetTypeLabel, getExpenseCategoryLabel, getDebtTypeLabel } from "@/lib/utils";

type FormatterType = "asset" | "expense" | "debt";

const formatters: Record<FormatterType, (key: string) => string> = {
  asset: getAssetTypeLabel,
  expense: getExpenseCategoryLabel,
  debt: getDebtTypeLabel,
};

interface DonutChartProps {
  data: Record<string, number>;
  title?: string;
  formatValue?: (value: number) => string;
  formatterType?: FormatterType;
}

export function DonutChart({
  data,
  title,
  formatValue = (v) => formatCurrency(v, "INR", true),
  formatterType = "asset",
}: DonutChartProps) {
  const labelFormatter = formatters[formatterType];
  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: labelFormatter(key),
      value,
      key,
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{formatValue(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
