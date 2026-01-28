"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DebtWithMetrics, DebtType } from "@/lib/types";
import {
  calculateMonthlyInterest,
  simulatePayoff,
  compareStrategies,
  type DebtForPayoff,
} from "@/lib/calc/payoff";

const DebtSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["home", "auto", "personal", "education", "cc"]),
  principal: z.number().positive("Principal must be positive"),
  currentBalance: z.number().min(0).optional(),
  apr: z.number().min(0).max(1, "APR should be decimal (e.g., 0.12 for 12%)"),
  emi: z.number().positive("EMI must be positive"),
  startDate: z.string().or(z.date()),
  tenureMonths: z.number().positive("Tenure must be positive"),
  nextDueDate: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional(),
});

export type DebtInput = z.infer<typeof DebtSchema>;

export async function getDebts() {
  return prisma.debt.findMany({
    orderBy: { apr: "desc" },
  });
}

export async function getDebtsWithMetrics(): Promise<DebtWithMetrics[]> {
  const debts = await prisma.debt.findMany({
    orderBy: { apr: "desc" },
  });

  return debts.map((d) => {
    const balance = d.currentBalance ?? d.principal;
    const monthlyInterest = calculateMonthlyInterest(balance, d.apr);

    // Calculate months remaining
    const startDate = new Date(d.startDate);
    const now = new Date();
    const monthsElapsed =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());
    const monthsRemaining = Math.max(0, d.tenureMonths - monthsElapsed);

    // Estimate total interest remaining (simplified)
    let totalInterestRemaining = 0;
    let tempBalance = balance;
    for (let i = 0; i < monthsRemaining && tempBalance > 0; i++) {
      const interest = calculateMonthlyInterest(tempBalance, d.apr);
      totalInterestRemaining += interest;
      tempBalance -= d.emi - interest;
    }

    return {
      id: d.id,
      name: d.name,
      type: d.type as DebtType,
      principal: d.principal,
      currentBalance: balance,
      apr: d.apr,
      emi: d.emi,
      startDate: d.startDate,
      tenureMonths: d.tenureMonths,
      nextDueDate: d.nextDueDate,
      monthsRemaining,
      totalInterestRemaining: Math.round(totalInterestRemaining * 100) / 100,
      monthlyInterest: Math.round(monthlyInterest * 100) / 100,
    };
  });
}

export async function getDebt(id: string) {
  return prisma.debt.findUnique({
    where: { id },
  });
}

export async function createDebt(data: DebtInput) {
  const validated = DebtSchema.parse(data);

  const debt = await prisma.debt.create({
    data: {
      name: validated.name,
      type: validated.type,
      principal: validated.principal,
      currentBalance: validated.currentBalance ?? validated.principal,
      apr: validated.apr,
      emi: validated.emi,
      startDate: new Date(validated.startDate),
      tenureMonths: validated.tenureMonths,
      nextDueDate: validated.nextDueDate ? new Date(validated.nextDueDate) : null,
      notes: validated.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/debts");
  return debt;
}

export async function updateDebt(id: string, data: DebtInput) {
  const validated = DebtSchema.parse(data);

  const debt = await prisma.debt.update({
    where: { id },
    data: {
      name: validated.name,
      type: validated.type,
      principal: validated.principal,
      currentBalance: validated.currentBalance ?? validated.principal,
      apr: validated.apr,
      emi: validated.emi,
      startDate: new Date(validated.startDate),
      tenureMonths: validated.tenureMonths,
      nextDueDate: validated.nextDueDate ? new Date(validated.nextDueDate) : null,
      notes: validated.notes,
    },
  });

  revalidatePath("/");
  revalidatePath("/debts");
  return debt;
}

export async function deleteDebt(id: string) {
  await prisma.debt.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/debts");
}

export async function getTotalDebtBalance() {
  const debts = await prisma.debt.findMany();
  return debts.reduce((sum, d) => sum + (d.currentBalance ?? d.principal), 0);
}

export async function getTotalMonthlyEmi() {
  const debts = await prisma.debt.findMany();
  return debts.reduce((sum, d) => sum + d.emi, 0);
}

export async function getCreditCardBalance() {
  const ccDebts = await prisma.debt.findMany({
    where: { type: "cc" },
  });
  return ccDebts.reduce((sum, d) => sum + (d.currentBalance ?? d.principal), 0);
}

export async function getHighestApr() {
  const debts = await prisma.debt.findMany({
    orderBy: { apr: "desc" },
    take: 1,
  });
  return debts.length > 0 ? debts[0].apr : 0;
}

export async function runPayoffSimulator(
  strategy: "avalanche" | "snowball",
  extraPayment: number
) {
  const debts = await prisma.debt.findMany();

  const debtData: DebtForPayoff[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.currentBalance ?? d.principal,
    apr: d.apr,
    minPayment: d.emi,
  }));

  return simulatePayoff(debtData, strategy, extraPayment);
}

export async function comparePayoffStrategies(extraPayment: number = 0) {
  const debts = await prisma.debt.findMany();

  const debtData: DebtForPayoff[] = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.currentBalance ?? d.principal,
    apr: d.apr,
    minPayment: d.emi,
  }));

  return compareStrategies(debtData, extraPayment);
}
