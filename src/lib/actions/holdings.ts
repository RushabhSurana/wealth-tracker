"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fetchPrices } from "@/lib/prices";
import type { HoldingWithPrice, AssetType } from "@/lib/types";

const HoldingSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  accountId: z.string().optional().nullable(),
  units: z.number().positive("Units must be positive"),
  avgCost: z.number().min(0, "Average cost cannot be negative"),
});

export type HoldingInput = z.infer<typeof HoldingSchema>;

export async function getHoldings() {
  return prisma.holding.findMany({
    include: {
      asset: {
        include: {
          prices: {
            orderBy: { asOf: "desc" },
            take: 1,
          },
        },
      },
      account: true,
    },
    orderBy: {
      asset: {
        name: "asc",
      },
    },
  });
}

export async function getHoldingsWithPrices(): Promise<HoldingWithPrice[]> {
  const holdings = await prisma.holding.findMany({
    include: {
      asset: {
        include: {
          prices: {
            orderBy: { asOf: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Get fresh prices for assets with symbols
  const assetsWithSymbols = holdings
    .filter((h) => h.asset.symbol)
    .map((h) => ({ symbol: h.asset.symbol!, type: h.asset.type }));

  const freshPrices = await fetchPrices(assetsWithSymbols);

  return holdings.map((h) => {
    // Use fresh price if available, otherwise latest from DB, otherwise avgCost
    let currentPrice = h.avgCost;

    if (h.asset.symbol && freshPrices.has(h.asset.symbol)) {
      currentPrice = freshPrices.get(h.asset.symbol)!.price;
    } else if (h.asset.prices.length > 0) {
      currentPrice = h.asset.prices[0].price;
    }

    const costBasis = h.units * h.avgCost;
    const currentValue = h.units * currentPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return {
      id: h.id,
      assetId: h.assetId,
      assetName: h.asset.name,
      assetType: h.asset.type as AssetType,
      symbol: h.asset.symbol,
      units: h.units,
      avgCost: h.avgCost,
      currentPrice,
      currentValue,
      costBasis,
      pnl,
      pnlPercent,
    };
  });
}

export async function getHolding(id: string) {
  return prisma.holding.findUnique({
    where: { id },
    include: {
      asset: true,
      account: true,
    },
  });
}

export async function createHolding(data: HoldingInput) {
  const validated = HoldingSchema.parse(data);

  const holding = await prisma.holding.create({
    data: {
      assetId: validated.assetId,
      accountId: validated.accountId || null,
      units: validated.units,
      avgCost: validated.avgCost,
    },
  });

  revalidatePath("/");
  revalidatePath("/investments");
  return holding;
}

export async function updateHolding(id: string, data: HoldingInput) {
  const validated = HoldingSchema.parse(data);

  const holding = await prisma.holding.update({
    where: { id },
    data: {
      assetId: validated.assetId,
      accountId: validated.accountId || null,
      units: validated.units,
      avgCost: validated.avgCost,
    },
  });

  revalidatePath("/");
  revalidatePath("/investments");
  return holding;
}

export async function deleteHolding(id: string) {
  await prisma.holding.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/investments");
}

export async function calculateTotalHoldingsValue(): Promise<number> {
  const holdings = await getHoldingsWithPrices();
  return holdings.reduce((sum, h) => sum + h.currentValue, 0);
}

export async function getHoldingsByType(): Promise<Record<string, number>> {
  const holdings = await getHoldingsWithPrices();
  const byType: Record<string, number> = {};

  for (const h of holdings) {
    byType[h.assetType] = (byType[h.assetType] || 0) + h.currentValue;
  }

  return byType;
}
