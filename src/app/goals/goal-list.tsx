"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { formatCurrency, formatInputDate } from "@/lib/utils";
import { createGoal, updateGoal, updateGoalProgress, deleteGoal, type GoalInput } from "@/lib/actions/goals";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  category: string;
  priority: number;
  notes: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
}

interface GoalListProps {
  goals: Goal[];
  categoryLabels: Record<string, string>;
}

const categoryOptions = [
  { value: "emergency", label: "Emergency Fund" },
  { value: "retirement", label: "Retirement" },
  { value: "house", label: "House" },
  { value: "car", label: "Car" },
  { value: "vacation", label: "Vacation" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

export function GoalList({ goals, categoryLabels }: GoalListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProgress, setNewProgress] = useState(0);

  const [formData, setFormData] = useState<GoalInput>({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    category: "other",
    priority: 1,
    notes: "",
  });

  const openAddModal = () => {
    setEditingGoal(null);
    setFormData({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      category: "other",
      priority: 1,
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      category: goal.category as GoalInput["category"],
      priority: goal.priority,
      deadline: goal.deadline ? formatInputDate(goal.deadline) : undefined,
      notes: goal.notes || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openProgressModal = (goal: Goal) => {
    setProgressGoal(goal);
    setNewProgress(goal.currentAmount);
    setIsProgressModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, formData);
      } else {
        await createGoal(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async () => {
    if (!progressGoal) return;
    setIsLoading(true);
    try {
      await updateGoalProgress(progressGoal.id, newProgress);
      setIsProgressModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    setIsLoading(true);
    try {
      await deleteGoal(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (percent: number, isCompleted: boolean) => {
    if (isCompleted) return "bg-green-500";
    if (percent >= 75) return "bg-green-500";
    if (percent >= 50) return "bg-blue-500";
    if (percent >= 25) return "bg-amber-500";
    return "bg-gray-400";
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openAddModal} size="sm">
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No goals set yet</p>
          <p className="text-sm">Create your first savings goal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0
              ? (goal.currentAmount / goal.targetAmount) * 100
              : 0;

            return (
              <div
                key={goal.id}
                className={"p-4 rounded-lg border " + (goal.isCompleted ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{goal.name}</h3>
                      {goal.isCompleted && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full dark:bg-green-800 dark:text-green-300">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {categoryLabels[goal.category] || goal.category}
                      {goal.deadline && " • Due: " + new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!goal.isCompleted && (
                      <button
                        onClick={() => openProgressModal(goal)}
                        className="text-green-600 hover:text-green-800 text-sm dark:text-green-400"
                      >
                        Update
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(goal)}
                      className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-600 hover:text-red-800 text-sm dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className={"h-3 rounded-full transition-all " + getProgressColor(progress, goal.isCompleted)}
                      style={{ width: Math.min(100, progress) + "%" }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(goal.currentAmount)} saved
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {progress.toFixed(1)}% of {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? "Edit Goal" : "Add Goal"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20">
              {error}
            </div>
          )}

          <Input
            label="Goal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Emergency Fund"
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as GoalInput["category"] })}
            options={categoryOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              value={formData.targetAmount || ""}
              onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
              required
              min={0}
              step={1000}
            />

            <Input
              label="Current Amount"
              type="number"
              value={formData.currentAmount || ""}
              onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
              min={0}
              step={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Deadline (optional)"
              type="date"
              value={formData.deadline || ""}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value || undefined })}
            />

            <Input
              label="Priority (1-10)"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              min={1}
              max={10}
            />
          </div>

          <Input
            label="Notes (optional)"
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {editingGoal ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Progress Update Modal */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        title="Update Progress"
      >
        {progressGoal && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Update progress for <strong>{progressGoal.name}</strong>
            </p>

            <Input
              label="Current Amount"
              type="number"
              value={newProgress || ""}
              onChange={(e) => setNewProgress(parseFloat(e.target.value) || 0)}
              min={0}
              step={1000}
            />

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Target: {formatCurrency(progressGoal.targetAmount)}
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsProgressModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProgressUpdate} loading={isLoading}>
                Save Progress
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
