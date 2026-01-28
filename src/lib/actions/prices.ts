"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { fetchPrices } from "@/lib/prices";

export async function refreshPrices() {
  // Get all assets with symbols
  const assets = await prisma.asset.findMany({
    where: {
      symbol: { not: null },
    },
    select: {
      id: true,
      symbol: true,
      type: true,
    },
  });

  if (assets.length === 0) {
    return { updated: 0 };
  }

  // Fetch fresh prices
  const assetData = assets
    .filter((a) => a.symbol)
    .map((a) => ({ symbol: a.symbol!, type: a.type }));

  const prices = await fetchPrices(assetData);

  // Store new prices
  const now = new Date();
  let updated = 0;

  for (const asset of assets) {
    if (asset.symbol && prices.has(asset.symbol)) {
      const priceData = prices.get(asset.symbol)!;

      await prisma.price.create({
        data: {
          assetId: asset.id,
          price: priceData.price,
          asOf: now,
        },
      });

      updated++;
    }
  }

  revalidatePath("/");
  revalidatePath("/investments");

  return { updated };
}

export async function getLatestPrices() {
  const assets = await prisma.asset.findMany({
    include: {
      prices: {
        orderBy: { asOf: "desc" },
        take: 1,
      },
    },
  });

  const priceMap: Record<string, { price: number; asOf: Date }> = {};

  for (const asset of assets) {
    if (asset.prices.length > 0) {
      priceMap[asset.id] = {
        price: asset.prices[0].price,
        asOf: asset.prices[0].asOf,
      };
    }
  }

  return priceMap;
}

export async function getPriceHistory(assetId: string, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.price.findMany({
    where: {
      assetId,
      asOf: { gte: since },
    },
    orderBy: { asOf: "asc" },
  });
}

export async function setManualPrice(assetId: string, price: number) {
  await prisma.price.create({
    data: {
      assetId,
      price,
      asOf: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/investments");
}

export async function cleanOldPrices(daysToKeep: number = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await prisma.price.deleteMany({
    where: {
      asOf: { lt: cutoff },
    },
  });

  return { deleted: result.count };
}
