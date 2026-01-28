"use server";

import prisma from "@/lib/db";
import { getAccounts } from "./accounts";
import { getHoldingsWithPrices } from "./holdings";
import { getDebtsWithMetrics } from "./debts";

export async function getNetWorthSnapshots(months: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return prisma.netWorthSnapshot.findMany({
    where: {
      asOfMonth: { gte: since },
    },
    orderBy: { asOfMonth: "asc" },
  });
}

export async function createSnapshot() {
  const now = new Date();
  const asOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate current values
  const accounts = await getAccounts();
  const cashTotal = accounts.reduce((sum, a) => sum + a.balance, 0);

  const holdings = await getHoldingsWithPrices();
  const holdingsTotal = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  const debts = await getDebtsWithMetrics();
  const debtsTotal = debts.reduce((sum, d) => sum + d.currentBalance, 0);

  // Liquid assets (cash + liquid investments)
  const liquidTypes = ["equity", "mf", "crypto", "gold"];
  const liquidHoldings = holdings
    .filter((h) => liquidTypes.includes(h.assetType))
    .reduce((sum, h) => sum + h.currentValue, 0);
  const liquidAssets = cashTotal + liquidHoldings;

  // Short-term liabilities
  const shortTermTypes = ["cc", "personal"];
  const shortTermLiabilities = debts
    .filter((d) => shortTermTypes.includes(d.type))
    .reduce((sum, d) => sum + d.currentBalance, 0);

  const totalAssets = cashTotal + holdingsTotal;
  const totalLiabilities = debtsTotal;
  const netWorth = totalAssets - totalLiabilities;
  const liquidNetWorth = liquidAssets - shortTermLiabilities;

  // Upsert to avoid duplicates for same month
  const snapshot = await prisma.netWorthSnapshot.upsert({
    where: { asOfMonth },
    update: {
      totalAssets,
      totalLiabilities,
      netWorth,
      liquidAssets,
      liquidNetWorth,
    },
    create: {
      asOfMonth,
      totalAssets,
      totalLiabilities,
      netWorth,
      liquidAssets,
      liquidNetWorth,
    },
  });

  return snapshot;
}

export async function getLatestSnapshot() {
  return prisma.netWorthSnapshot.findFirst({
    orderBy: { asOfMonth: "desc" },
  });
}

export async function getNetWorthChange() {
  const snapshots = await getNetWorthSnapshots(2);

  if (snapshots.length < 2) {
    return { change: 0, changePercent: 0 };
  }

  const current = snapshots[snapshots.length - 1];
  const previous = snapshots[snapshots.length - 2];

  const change = current.netWorth - previous.netWorth;
  const changePercent =
    previous.netWorth !== 0 ? (change / previous.netWorth) * 100 : 0;

  return {
    change,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}
