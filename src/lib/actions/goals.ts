"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const GoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0).default(0),
  deadline: z.string().optional(),
  category: z.enum(["emergency", "retirement", "house", "car", "vacation", "education", "other"]),
  priority: z.number().int().min(1).max(10).default(1),
  notes: z.string().optional(),
});

export type GoalInput = z.infer<typeof GoalSchema>;

export async function getGoals() {
  return prisma.savingsGoal.findMany({
    orderBy: [{ isCompleted: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function getActiveGoals() {
  return prisma.savingsGoal.findMany({
    where: { isCompleted: false },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
}

export async function getGoalById(id: string) {
  return prisma.savingsGoal.findUnique({
    where: { id },
  });
}

export async function createGoal(data: GoalInput) {
  const validated = GoalSchema.parse(data);

  const goal = await prisma.savingsGoal.create({
    data: {
      name: validated.name,
      targetAmount: validated.targetAmount,
      currentAmount: validated.currentAmount,
      deadline: validated.deadline ? new Date(validated.deadline) : null,
      category: validated.category,
      priority: validated.priority,
      notes: validated.notes,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return goal;
}

export async function updateGoal(id: string, data: Partial<GoalInput>) {
  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return goal;
}

export async function updateGoalProgress(id: string, currentAmount: number) {
  const goal = await prisma.savingsGoal.findUnique({ where: { id } });
  if (!goal) throw new Error("Goal not found");

  const isCompleted = currentAmount >= goal.targetAmount;

  await prisma.savingsGoal.update({
    where: { id },
    data: {
      currentAmount,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: string) {
  await prisma.savingsGoal.delete({ where: { id } });
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function getGoalsSummary() {
  const goals = await getActiveGoals();

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return {
    activeGoals: goals.length,
    totalTarget,
    totalSaved,
    overallProgress: Math.round(overallProgress * 10) / 10,
  };
}
