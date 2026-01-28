"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate, formatInputDate, getIncomeTypeLabel } from "@/lib/utils";
import { createIncomeStream, updateIncomeStream, deleteIncomeStream, type IncomeInput } from "@/lib/actions/income";

interface IncomeStream {
  id: string;
  name: string;
  type: string;
  amountMonthly: number;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
}

interface IncomeListProps {
  incomeStreams: IncomeStream[];
}

const incomeTypes = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "rental", label: "Rental" },
  { value: "dividend", label: "Dividend" },
  { value: "other", label: "Other" },
];

export function IncomeList({ incomeStreams }: IncomeListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<IncomeInput>({
    name: "",
    type: "salary",
    amountMonthly: 0,
    startDate: formatInputDate(new Date()),
    notes: "",
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      type: "salary",
      amountMonthly: 0,
      startDate: formatInputDate(new Date()),
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: IncomeStream) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type as IncomeInput["type"],
      amountMonthly: item.amountMonthly,
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
        await updateIncomeStream(editingItem.id, formData);
      } else {
        await createIncomeStream(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income stream?")) return;

    setIsLoading(true);
    try {
      await deleteIncomeStream(id);
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
          Add Income
        </Button>
      </div>

      {incomeStreams.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No income streams yet</p>
          <p className="text-sm">Add your first income source</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead align="right">Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomeStreams.map((item) => (
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
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    {getIncomeTypeLabel(item.type)}
                  </span>
                </TableCell>
                <TableCell align="right" className="font-medium text-green-600">
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
        title={editingItem ? "Edit Income Stream" : "Add Income Stream"}
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
            placeholder="e.g., Monthly Salary"
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as IncomeInput["type"] })}
            options={incomeTypes}
          />

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
