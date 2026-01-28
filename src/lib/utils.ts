/**
 * Utility functions for formatting and display
 */

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  compact: boolean = false
): string {
  if (compact && Math.abs(amount) >= 100000) {
    // Indian numbering system for lakhs and crores
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatInputDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getAssetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    equity: "Equity",
    mf: "Mutual Funds",
    crypto: "Crypto",
    gold: "Gold",
    realestate: "Real Estate",
    vehicle: "Vehicle",
    custom: "Other",
    cash: "Cash",
  };
  return labels[type] || type;
}

export function getDebtTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    home: "Home Loan",
    auto: "Auto Loan",
    personal: "Personal Loan",
    education: "Education Loan",
    cc: "Credit Card",
  };
  return labels[type] || type;
}

export function getIncomeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    salary: "Salary",
    freelance: "Freelance",
    rental: "Rental",
    dividend: "Dividend",
    other: "Other",
  };
  return labels[type] || type;
}

export function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    housing: "Housing",
    transport: "Transport",
    food: "Food & Dining",
    utilities: "Utilities",
    entertainment: "Entertainment",
    health: "Health",
    education: "Education",
    emi: "EMI",
    other: "Other",
  };
  return labels[category] || category;
}

export function getAlertColor(severity: string): string {
  switch (severity) {
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    case "medium":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "low":
      return "text-blue-600 bg-blue-50 border-blue-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getPnlColor(value: number): string {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-600";
}

// Chart colors
export const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
