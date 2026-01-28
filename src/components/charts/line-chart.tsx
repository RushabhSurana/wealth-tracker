"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface LineConfig {
  key: string;
  name: string;
  color: string;
}

interface LineChartProps {
  data: Record<string, string | number>[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
  formatYAxis?: boolean;
}

export function LineChart({
  data,
  lines,
  xAxisKey,
  height = 300,
  formatYAxis = true,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data to display
      </div>
    );
  }

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 10000000) {
      return (value / 10000000).toFixed(1) + "Cr";
    }
    if (Math.abs(value) >= 100000) {
      return (value / 100000).toFixed(1) + "L";
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(0) + "K";
    }
    return value.toString();
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis
          tickFormatter={formatYAxis ? formatValue : undefined}
          tick={{ fontSize: 12 }}
          className="text-gray-600 dark:text-gray-400"
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            backgroundColor: "var(--tooltip-bg, white)",
            borderColor: "var(--tooltip-border, #e5e7eb)",
          }}
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
