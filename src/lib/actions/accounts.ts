"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["cash", "bank", "wallet", "savings"]),
  currency: z.string().default("INR"),
  balance: z.number().min(0, "Balance cannot be negative"),
  notes: z.string().optional(),
});

export type AccountInput = z.infer<typeof AccountSchema>;

export async function getAccounts() {
  return prisma.account.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getAccount(id: string) {
  return prisma.account.findUnique({
    where: { id },
  });
}

export async function createAccount(data: AccountInput) {
  const validated = AccountSchema.parse(data);

  const account = await prisma.account.create({
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/investments");
  return account;
}

export async function updateAccount(id: string, data: AccountInput) {
  const validated = AccountSchema.parse(data);

  const account = await prisma.account.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/");
  revalidatePath("/investments");
  return account;
}

export async function deleteAccount(id: string) {
  await prisma.account.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/investments");
}

export async function getTotalCashBalance() {
  const accounts = await prisma.account.findMany();
  return accounts.reduce((sum, acc) => sum + acc.balance, 0);
}
