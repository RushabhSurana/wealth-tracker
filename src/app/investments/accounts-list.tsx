"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { createAccount, updateAccount, deleteAccount, type AccountInput } from "@/lib/actions/accounts";

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  notes: string | null;
}

interface AccountsListProps {
  accounts: Account[];
}

const accountTypes = [
  { value: "bank", label: "Bank Account" },
  { value: "savings", label: "Savings/FD" },
  { value: "wallet", label: "Wallet" },
  { value: "cash", label: "Cash" },
];

export function AccountsList({ accounts }: AccountsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AccountInput>({
    name: "",
    type: "bank",
    currency: "INR",
    balance: 0,
    notes: "",
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      type: "bank",
      currency: "INR",
      balance: 0,
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Account) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type as AccountInput["type"],
      currency: item.currency,
      balance: item.balance,
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
        await updateAccount(editingItem.id, formData);
      } else {
        await createAccount(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    setIsLoading(true);
    try {
      await deleteAccount(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const found = accountTypes.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAddModal} size="sm">
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No accounts yet</p>
          <p className="text-sm">Add your first cash account</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead align="right">Balance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    {account.notes && (
                      <p className="text-xs text-gray-500">{account.notes}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    {getTypeLabel(account.type)}
                  </span>
                </TableCell>
                <TableCell align="right" className="font-medium">
                  {formatCurrency(account.balance)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(account)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
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
        title={editingItem ? "Edit Account" : "Add Account"}
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
            placeholder="e.g., HDFC Savings"
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountInput["type"] })}
            options={accountTypes}
          />

          <Input
            label="Balance"
            type="number"
            value={formData.balance || ""}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            required
            min={0}
            step={100}
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
