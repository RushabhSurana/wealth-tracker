"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AssetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["equity", "mf", "crypto", "gold", "realestate", "vehicle", "custom"]),
  symbol: z.string().optional(),
  currency: z.string().default("INR"),
  notes: z.string().optional(),
});

export type AssetInput = z.infer<typeof AssetSchema>;

export async function getAssets() {
  return prisma.asset.findMany({
    orderBy: { name: "asc" },
    include: {
      holdings: true,
      prices: {
        orderBy: { asOf: "desc" },
        take: 1,
      },
    },
  });
}

export async function getAsset(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      holdings: true,
      prices: {
        orderBy: { asOf: "desc" },
        take: 1,
      },
    },
  });
}

export async function createAsset(data: AssetInput) {
  const validated = AssetSchema.parse(data);

  const asset = await prisma.asset.create({
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/investments");
  return asset;
}

export async function updateAsset(id: string, data: AssetInput) {
  const validated = AssetSchema.parse(data);

  const asset = await prisma.asset.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/investments");
  return asset;
}

export async function deleteAsset(id: string) {
  await prisma.asset.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/investments");
}

export async function getAssetsByType(type: string) {
  return prisma.asset.findMany({
    where: { type },
    include: {
      holdings: true,
      prices: {
        orderBy: { asOf: "desc" },
        take: 1,
      },
    },
  });
}
