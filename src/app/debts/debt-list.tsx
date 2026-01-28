"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate, formatInputDate, getDebtTypeLabel } from "@/lib/utils";
import { createDebt, updateDebt, deleteDebt, type DebtInput } from "@/lib/actions/debts";
import type { DebtWithMetrics } from "@/lib/types";

interface DebtListProps {
  debts: DebtWithMetrics[];
}

const debtTypes = [
  { value: "home", label: "Home Loan" },
  { value: "auto", label: "Auto Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "education", label: "Education Loan" },
  { value: "cc", label: "Credit Card" },
];

export function DebtList({ debts }: DebtListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtWithMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DebtInput>({
    name: "",
    type: "personal",
    principal: 0,
    currentBalance: 0,
    apr: 0.12,
    emi: 0,
    startDate: formatInputDate(new Date()),
    tenureMonths: 12,
    notes: "",
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      type: "personal",
      principal: 0,
      currentBalance: 0,
      apr: 0.12,
      emi: 0,
      startDate: formatInputDate(new Date()),
      tenureMonths: 12,
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: DebtWithMetrics) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      principal: item.principal,
      currentBalance: item.currentBalance,
      apr: item.apr,
      emi: item.emi,
      startDate: formatInputDate(item.startDate),
      tenureMonths: item.tenureMonths,
      nextDueDate: item.nextDueDate ? formatInputDate(item.nextDueDate) : undefined,
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (editingItem) {
        await updateDebt(editingItem.id, formData);
      } else {
        await createDebt(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this debt?")) return;

    setIsLoading(true);
    try {
      await deleteDebt(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAddModal} size="sm">
          Add Debt
        </Button>
      </div>

      {debts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No debts tracked</p>
          <p className="text-sm">Add your first debt to start tracking</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead align="right">Balance</TableHead>
                <TableHead align="right">APR</TableHead>
                <TableHead align="right">EMI</TableHead>
                <TableHead align="right">Remaining</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{debt.name}</p>
                      <p className="text-xs text-gray-500">
                        Interest: {formatCurrency(debt.monthlyInterest)}/mo
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      debt.type === 'cc' ? 'bg-red-100 text-red-700' :
                      debt.type === 'home' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {getDebtTypeLabel(debt.type)}
                    </span>
                  </TableCell>
                  <TableCell align="right" className="font-medium">
                    {formatCurrency(debt.currentBalance)}
                  </TableCell>
                  <TableCell align="right">
                    <span className={debt.apr > 0.15 ? 'text-red-600 font-medium' : ''}>
                      {(debt.apr * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(debt.emi)}
                  </TableCell>
                  <TableCell align="right">
                    {debt.monthsRemaining} mo
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(debt)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Debt" : "Add Debt"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Home Loan"
            />

            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as DebtInput["type"] })}
              options={debtTypes}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Original Principal"
              type="number"
              value={formData.principal || ""}
              onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })}
              required
              min={0}
              step={1000}
            />

            <Input
              label="Current Balance"
              type="number"
              value={formData.currentBalance || ""}
              onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
              min={0}
              step={1000}
              helpText="Leave empty to use principal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="APR (%)"
              type="number"
              value={(formData.apr * 100) || ""}
              onChange={(e) => setFormData({ ...formData, apr: (parseFloat(e.target.value) || 0) / 100 })}
              required
              min={0}
              max={100}
              step={0.1}
              helpText="Annual Percentage Rate"
            />

            <Input
              label="Monthly EMI"
              type="number"
              value={formData.emi || ""}
              onChange={(e) => setFormData({ ...formData, emi: parseFloat(e.target.value) || 0 })}
              required
              min={0}
              step={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={String(formData.startDate)}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />

            <Input
              label="Tenure (months)"
              type="number"
              value={formData.tenureMonths || ""}
              onChange={(e) => setFormData({ ...formData, tenureMonths: parseInt(e.target.value) || 0 })}
              required
              min={1}
              max={600}
            />
          </div>

          <Input
            label="Next Due Date (optional)"
            type="date"
            value={formData.nextDueDate ? String(formData.nextDueDate) : ""}
            onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value || undefined })}
          />

          <Input
            label="Notes (optional)"
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {editingItem ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
