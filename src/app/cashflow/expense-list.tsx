"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatInputDate, getExpenseCategoryLabel } from "@/lib/utils";
import { createExpenseItem, updateExpenseItem, deleteExpenseItem, type ExpenseInput } from "@/lib/actions/expenses";

interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amountMonthly: number;
  type: string;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
}

interface ExpenseListProps {
  expenseItems: ExpenseItem[];
}

const expenseCategories = [
  { value: "housing", label: "Housing" },
  { value: "transport", label: "Transport" },
  { value: "food", label: "Food & Dining" },
  { value: "utilities", label: "Utilities" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const expenseTypes = [
  { value: "fixed", label: "Fixed" },
  { value: "variable", label: "Variable" },
];

export function ExpenseList({ expenseItems }: ExpenseListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExpenseInput>({
    name: "",
    category: "other",
    amountMonthly: 0,
    type: "variable",
    startDate: formatInputDate(new Date()),
    notes: "",
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "other",
      amountMonthly: 0,
      type: "variable",
      startDate: formatInputDate(new Date()),
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category as ExpenseInput["category"],
      amountMonthly: item.amountMonthly,
      type: item.type as ExpenseInput["type"],
      startDate: formatInputDate(item.startDate),
      endDate: item.endDate ? formatInputDate(item.endDate) : undefined,
      notes: item.notes || "",
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
        await updateExpenseItem(editingItem.id, formData);
      } else {
        await createExpenseItem(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setIsLoading(true);
    try {
      await deleteExpenseItem(id);
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
          Add Expense
        </Button>
      </div>

      {expenseItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No expenses tracked yet</p>
          <p className="text-sm">Add your first expense</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead align="right">Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenseItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-gray-500">{item.notes}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {getExpenseCategoryLabel(item.category)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${item.type === 'fixed' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {item.type === "fixed" ? "Fixed" : "Variable"}
                  </span>
                </TableCell>
                <TableCell align="right" className="font-medium text-red-600">
                  {formatCurrency(item.amountMonthly)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Expense" : "Add Expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Monthly Rent"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseInput["category"] })}
              options={expenseCategories}
            />

            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseInput["type"] })}
              options={expenseTypes}
            />
          </div>

          <Input
            label="Monthly Amount"
            type="number"
            value={formData.amountMonthly || ""}
            onChange={(e) => setFormData({ ...formData, amountMonthly: parseFloat(e.target.value) || 0 })}
            required
            min={0}
            step={100}
          />

          <Input
            label="Start Date"
            type="date"
            value={String(formData.startDate)}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />

          <Input
            label="End Date (optional)"
            type="date"
            value={formData.endDate ? String(formData.endDate) : ""}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
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
