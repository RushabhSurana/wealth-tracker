"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getExpensesByCategory } from "./expenses";

export async function getBudgetCategories() {
  return prisma.budgetCategory.findMany({
    orderBy: { category: "asc" },
  });
}

export async function setBudgetLimit(category: string, monthlyLimit: number) {
  const budget = await prisma.budgetCategory.upsert({
    where: { category },
    update: { monthlyLimit },
    create: { category, monthlyLimit },
  });

  revalidatePath("/cashflow");
  revalidatePath("/settings");
  return budget;
}

export async function deleteBudgetLimit(category: string) {
  await prisma.budgetCategory.delete({
    where: { category },
  });
  revalidatePath("/cashflow");
  revalidatePath("/settings");
}

export async function getBudgetStatus() {
  const [budgets, expensesByCategory] = await Promise.all([
    getBudgetCategories(),
    getExpensesByCategory(),
  ]);

  const status = budgets.map((budget) => {
    const spent = expensesByCategory[budget.category] || 0;
    const remaining = budget.monthlyLimit - spent;
    const percentUsed = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

    return {
      category: budget.category,
      limit: budget.monthlyLimit,
      spent,
      remaining,
      percentUsed: Math.round(percentUsed * 10) / 10,
      isOverBudget: spent > budget.monthlyLimit,
      isWarning: percentUsed >= 80 && percentUsed < 100,
    };
  });

  return status;
}

export async function getBudgetAlerts() {
  const status = await getBudgetStatus();

  return status
    .filter((s) => s.isOverBudget || s.isWarning)
    .map((s) => ({
      category: s.category,
      message: s.isOverBudget
        ? "Over budget by " + Math.abs(s.remaining).toLocaleString()
        : s.percentUsed + "% of budget used",
      severity: s.isOverBudget ? "error" : "warning",
      percentUsed: s.percentUsed,
    }));
}
