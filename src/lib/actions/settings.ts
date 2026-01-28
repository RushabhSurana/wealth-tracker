"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AllocationTargets, SettingsFormData } from "@/lib/types";

const SettingsSchema = z.object({
  emergencyFundMonthsTarget: z.number().min(1).max(24),
  emiToIncomeMaxPercent: z.number().min(1).max(100),
  ccUtilizationMaxPercent: z.number().min(1).max(100),
  allocationTargets: z.object({
    equity: z.number().min(0).max(100),
    mf: z.number().min(0).max(100),
    crypto: z.number().min(0).max(100),
    gold: z.number().min(0).max(100),
    realestate: z.number().min(0).max(100),
    other: z.number().min(0).max(100),
  }),
});

export async function getSettings(): Promise<SettingsFormData> {
  let settings = await prisma.settings.findUnique({
    where: { id: "settings" },
  });

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: "settings",
        emergencyFundMonthsTarget: 6,
        emiToIncomeMaxPercent: 35,
        ccUtilizationMaxPercent: 30,
        allocationTargetsJson: JSON.stringify({
          equity: 40,
          mf: 25,
          crypto: 10,
          gold: 10,
          realestate: 10,
          other: 5,
        }),
      },
    });
  }

  const allocationTargets: AllocationTargets = JSON.parse(
    settings.allocationTargetsJson
  );

  return {
    emergencyFundMonthsTarget: settings.emergencyFundMonthsTarget,
    emiToIncomeMaxPercent: settings.emiToIncomeMaxPercent,
    ccUtilizationMaxPercent: settings.ccUtilizationMaxPercent,
    allocationTargets,
  };
}

export async function updateSettings(data: SettingsFormData) {
  const validated = SettingsSchema.parse(data);

  // Validate allocation targets sum to 100
  const allocationSum = Object.values(validated.allocationTargets).reduce(
    (sum, v) => sum + v,
    0
  );
  if (allocationSum !== 100) {
    throw new Error(`Allocation targets must sum to 100%, got ${allocationSum}%`);
  }

  const settings = await prisma.settings.upsert({
    where: { id: "settings" },
    update: {
      emergencyFundMonthsTarget: validated.emergencyFundMonthsTarget,
      emiToIncomeMaxPercent: validated.emiToIncomeMaxPercent,
      ccUtilizationMaxPercent: validated.ccUtilizationMaxPercent,
      allocationTargetsJson: JSON.stringify(validated.allocationTargets),
    },
    create: {
      id: "settings",
      emergencyFundMonthsTarget: validated.emergencyFundMonthsTarget,
      emiToIncomeMaxPercent: validated.emiToIncomeMaxPercent,
      ccUtilizationMaxPercent: validated.ccUtilizationMaxPercent,
      allocationTargetsJson: JSON.stringify(validated.allocationTargets),
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");

  return {
    emergencyFundMonthsTarget: settings.emergencyFundMonthsTarget,
    emiToIncomeMaxPercent: settings.emiToIncomeMaxPercent,
    ccUtilizationMaxPercent: settings.ccUtilizationMaxPercent,
    allocationTargets: JSON.parse(settings.allocationTargetsJson),
  };
}
