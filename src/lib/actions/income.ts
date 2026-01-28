"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const IncomeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["salary", "freelance", "rental", "dividend", "other"]),
  amountMonthly: z.number().positive("Amount must be positive"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional(),
});

export type IncomeInput = z.infer<typeof IncomeSchema>;

export async function getIncomeStreams() {
  return prisma.incomeStream.findMany({
    orderBy: { amountMonthly: "desc" },
  });
}

export async function getActiveIncomeStreams() {
  const now = new Date();
  return prisma.incomeStream.findMany({
    where: {
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: { amountMonthly: "desc" },
  });
}

export async function getIncomeStream(id: string) {
  return prisma.incomeStream.findUnique({
    where: { id },
  });
}

export async function createIncomeStream(data: IncomeInput) {
  const validated = IncomeSchema.parse(data);

  const income = await prisma.incomeStream.create({
    data: {
      name: validated.name,
      type: validated.type,
      amountMonthly: validated.amountMonthly,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      notes: validated.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/cashflow");
  return income;
}

export async function updateIncomeStream(id: string, data: IncomeInput) {
  const validated = IncomeSchema.parse(data);

  const income = await prisma.incomeStream.update({
    where: { id },
    data: {
      name: validated.name,
      type: validated.type,
      amountMonthly: validated.amountMonthly,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      notes: validated.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/cashflow");
  return income;
}

export async function deleteIncomeStream(id: string) {
  await prisma.incomeStream.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/cashflow");
}

export async function getTotalMonthlyIncome() {
  const streams = await getActiveIncomeStreams();
  return streams.reduce((sum, s) => sum + s.amountMonthly, 0);
}

export async function getIncomeByType() {
  const streams = await getActiveIncomeStreams();
  const byType: Record<string, number> = {};

  for (const s of streams) {
    byType[s.type] = (byType[s.type] || 0) + s.amountMonthly;
  }

  return byType;
}
