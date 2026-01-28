"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ExpenseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum([
    "housing",
    "transport",
    "food",
    "utilities",
    "entertainment",
    "health",
    "education",
    "emi",
    "other",
  ]),
  amountMonthly: z.number().min(0, "Amount cannot be negative"),
  type: z.enum(["fixed", "variable"]),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;

export async function getExpenseItems() {
  return prisma.expenseItem.findMany({
    orderBy: { amountMonthly: "desc" },
  });
}

export async function getActiveExpenseItems() {
  const now = new Date();
  return prisma.expenseItem.findMany({
    where: {
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: { amountMonthly: "desc" },
  });
}

export async function getExpenseItem(id: string) {
  return prisma.expenseItem.findUnique({
    where: { id },
  });
}

export async function createExpenseItem(data: ExpenseInput) {
  const validated = ExpenseSchema.parse(data);

  const expense = await prisma.expenseItem.create({
    data: {
      name: validated.name,
      category: validated.category,
      amountMonthly: validated.amountMonthly,
      type: validated.type,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      notes: validated.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/cashflow");
  return expense;
}

export async function updateExpenseItem(id: string, data: ExpenseInput) {
  const validated = ExpenseSchema.parse(data);

  const expense = await prisma.expenseItem.update({
    where: { id },
    data: {
      name: validated.name,
      category: validated.category,
      amountMonthly: validated.amountMonthly,
      type: validated.type,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      notes: validated.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/cashflow");
  return expense;
}

export async function deleteExpenseItem(id: string) {
  await prisma.expenseItem.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/cashflow");
}

export async function getTotalMonthlyExpenses() {
  const items = await getActiveExpenseItems();
  // Exclude EMI category since debts track that separately
  return items
    .filter((e) => e.category !== "emi")
    .reduce((sum, e) => sum + e.amountMonthly, 0);
}

export async function getExpensesByCategory() {
  const items = await getActiveExpenseItems();
  const byCategory: Record<string, number> = {};

  for (const e of items) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amountMonthly;
  }

  return byCategory;
}

export async function getExpensesByType() {
  const items = await getActiveExpenseItems();
  const fixed = items
    .filter((e) => e.type === "fixed")
    .reduce((sum, e) => sum + e.amountMonthly, 0);
  const variable = items
    .filter((e) => e.type === "variable")
    .reduce((sum, e) => sum + e.amountMonthly, 0);

  return { fixed, variable };
}
