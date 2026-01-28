"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ExportData } from "@/lib/types";

export async function exportData(): Promise<ExportData> {
  const [accounts, assets, holdings, debts, incomeStreams, expenseItems, settings] =
    await Promise.all([
      prisma.account.findMany(),
      prisma.asset.findMany(),
      prisma.holding.findMany({ include: { asset: true } }),
      prisma.debt.findMany(),
      prisma.incomeStream.findMany(),
      prisma.expenseItem.findMany(),
      prisma.settings.findFirst(),
    ]);

  const allocationTargets = settings?.allocationTargetsJson
    ? JSON.parse(settings.allocationTargetsJson)
    : { equity: 40, mf: 25, crypto: 10, gold: 10, realestate: 10, other: 5 };

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    accounts: accounts.map((a) => ({
      name: a.name,
      type: a.type as "cash" | "bank" | "wallet" | "savings",
      currency: a.currency,
      balance: a.balance,
      notes: a.notes || undefined,
    })),
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type as "equity" | "mf" | "crypto" | "gold" | "realestate" | "vehicle" | "custom",
      symbol: a.symbol || undefined,
      currency: a.currency,
      notes: a.notes || undefined,
    })),
    holdings: holdings.map((h) => ({
      assetId: h.assetId,
      assetSymbol: h.asset.symbol || undefined,
      accountId: h.accountId || undefined,
      units: h.units,
      avgCost: h.avgCost,
    })),
    debts: debts.map((d) => ({
      name: d.name,
      type: d.type as "home" | "auto" | "personal" | "education" | "cc",
      principal: d.principal,
      currentBalance: d.currentBalance || undefined,
      apr: d.apr,
      emi: d.emi,
      startDate: d.startDate.toISOString().split("T")[0],
      tenureMonths: d.tenureMonths,
      nextDueDate: d.nextDueDate?.toISOString().split("T")[0],
      notes: d.notes || undefined,
    })),
    incomeStreams: incomeStreams.map((i) => ({
      name: i.name,
      type: i.type as "salary" | "freelance" | "rental" | "dividend" | "other",
      amountMonthly: i.amountMonthly,
      startDate: i.startDate.toISOString().split("T")[0],
      endDate: i.endDate?.toISOString().split("T")[0],
      notes: i.notes || undefined,
    })),
    expenseItems: expenseItems.map((e) => ({
      name: e.name,
      category: e.category as "housing" | "transport" | "food" | "utilities" | "entertainment" | "health" | "education" | "emi" | "other",
      amountMonthly: e.amountMonthly,
      type: e.type as "fixed" | "variable",
      startDate: e.startDate.toISOString().split("T")[0],
      endDate: e.endDate?.toISOString().split("T")[0],
      notes: e.notes || undefined,
    })),
    settings: {
      emergencyFundMonthsTarget: settings?.emergencyFundMonthsTarget || 6,
      emiToIncomeMaxPercent: settings?.emiToIncomeMaxPercent || 35,
      ccUtilizationMaxPercent: settings?.ccUtilizationMaxPercent || 30,
      allocationTargets,
    },
  };
}

export async function importData(data: ExportData): Promise<{ imported: number }> {
  let imported = 0;

  // Import accounts (skip if name exists)
  for (const account of data.accounts) {
    const existing = await prisma.account.findFirst({
      where: { name: account.name },
    });
    if (!existing) {
      await prisma.account.create({
        data: {
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance: account.balance,
          notes: account.notes,
        },
      });
      imported++;
    }
  }

  // Import assets (skip if name exists)
  const assetIdMap = new Map<string, string>();
  for (const asset of data.assets) {
    const existing = await prisma.asset.findFirst({
      where: { name: asset.name },
    });
    if (existing) {
      if (asset.id) assetIdMap.set(asset.id, existing.id);
    } else {
      const created = await prisma.asset.create({
        data: {
          name: asset.name,
          type: asset.type,
          symbol: asset.symbol,
          currency: asset.currency,
          notes: asset.notes,
        },
      });
      if (asset.id) assetIdMap.set(asset.id, created.id);
      imported++;
    }
  }

  // Import holdings
  for (const holding of data.holdings) {
    // Map old asset ID to new one
    const newAssetId = assetIdMap.get(holding.assetId) || holding.assetId;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: newAssetId },
    });
    if (!asset) continue;

    // Check if holding already exists
    const existing = await prisma.holding.findFirst({
      where: {
        assetId: newAssetId,
        units: holding.units,
        avgCost: holding.avgCost,
      },
    });
    if (!existing) {
      await prisma.holding.create({
        data: {
          assetId: newAssetId,
          units: holding.units,
          avgCost: holding.avgCost,
        },
      });
      imported++;
    }
  }

  // Import debts (skip if name exists)
  for (const debt of data.debts) {
    const existing = await prisma.debt.findFirst({
      where: { name: debt.name },
    });
    if (!existing) {
      await prisma.debt.create({
        data: {
          name: debt.name,
          type: debt.type,
          principal: debt.principal,
          currentBalance: debt.currentBalance,
          apr: debt.apr,
          emi: debt.emi,
          startDate: new Date(debt.startDate),
          tenureMonths: debt.tenureMonths,
          nextDueDate: debt.nextDueDate ? new Date(debt.nextDueDate) : null,
          notes: debt.notes,
        },
      });
      imported++;
    }
  }

  // Import income streams (skip if name exists)
  for (const income of data.incomeStreams) {
    const existing = await prisma.incomeStream.findFirst({
      where: { name: income.name },
    });
    if (!existing) {
      await prisma.incomeStream.create({
        data: {
          name: income.name,
          type: income.type,
          amountMonthly: income.amountMonthly,
          startDate: new Date(income.startDate),
          endDate: income.endDate ? new Date(income.endDate) : null,
          notes: income.notes,
        },
      });
      imported++;
    }
  }

  // Import expense items (skip if name exists)
  for (const expense of data.expenseItems) {
    const existing = await prisma.expenseItem.findFirst({
      where: { name: expense.name },
    });
    if (!existing) {
      await prisma.expenseItem.create({
        data: {
          name: expense.name,
          category: expense.category,
          amountMonthly: expense.amountMonthly,
          type: expense.type,
          startDate: new Date(expense.startDate),
          endDate: expense.endDate ? new Date(expense.endDate) : null,
          notes: expense.notes,
        },
      });
      imported++;
    }
  }

  // Update settings
  if (data.settings) {
    await prisma.settings.upsert({
      where: { id: "settings" },
      update: {
        emergencyFundMonthsTarget: data.settings.emergencyFundMonthsTarget,
        emiToIncomeMaxPercent: data.settings.emiToIncomeMaxPercent,
        ccUtilizationMaxPercent: data.settings.ccUtilizationMaxPercent,
        allocationTargetsJson: JSON.stringify(data.settings.allocationTargets),
      },
      create: {
        id: "settings",
        emergencyFundMonthsTarget: data.settings.emergencyFundMonthsTarget,
        emiToIncomeMaxPercent: data.settings.emiToIncomeMaxPercent,
        ccUtilizationMaxPercent: data.settings.ccUtilizationMaxPercent,
        allocationTargetsJson: JSON.stringify(data.settings.allocationTargets),
      },
    });
  }

  // Revalidate all paths
  revalidatePath("/");
  revalidatePath("/cashflow");
  revalidatePath("/debts");
  revalidatePath("/investments");
  revalidatePath("/settings");

  return { imported };
}
