"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSettings } from "@/lib/actions/settings";
import type { SettingsFormData, AllocationTargets } from "@/lib/types";

interface SettingsFormProps {
  initialSettings: SettingsFormData;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<SettingsFormData>(initialSettings);

  const allocationSum = Object.values(formData.allocationTargets).reduce(
    (sum, v) => sum + v,
    0
  );

  const handleAllocationChange = (key: keyof AllocationTargets, value: number) => {
    setFormData({
      ...formData,
      allocationTargets: {
        ...formData.allocationTargets,
        [key]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      {/* Emergency Fund Target */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Emergency Fund</h4>
        <Input
          label="Target Months of Expenses"
          type="number"
          value={formData.emergencyFundMonthsTarget}
          onChange={(e) =>
            setFormData({
              ...formData,
              emergencyFundMonthsTarget: parseInt(e.target.value) || 6,
            })
          }
          min={1}
          max={24}
          helpText="Recommended: 6 months for salaried, 12 months for self-employed"
        />
      </div>

      {/* Debt Thresholds */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Debt Thresholds</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Max EMI to Income (%)"
            type="number"
            value={formData.emiToIncomeMaxPercent}
            onChange={(e) =>
              setFormData({
                ...formData,
                emiToIncomeMaxPercent: parseInt(e.target.value) || 35,
              })
            }
            min={1}
            max={100}
            helpText="Alert if EMIs exceed this % of income"
          />
          <Input
            label="Max CC Utilization (%)"
            type="number"
            value={formData.ccUtilizationMaxPercent}
            onChange={(e) =>
              setFormData({
                ...formData,
                ccUtilizationMaxPercent: parseInt(e.target.value) || 30,
              })
            }
            min={1}
            max={100}
            helpText="Alert if CC balance exceeds this % of income"
          />
        </div>
      </div>

      {/* Allocation Targets */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">
          Target Asset Allocation
          <span
            className={`ml-2 text-sm font-normal ${
              allocationSum === 100 ? "text-green-600" : "text-red-600"
            }`}
          >
            (Total: {allocationSum}% - must equal 100%)
          </span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Input
            label="Equity (%)"
            type="number"
            value={formData.allocationTargets.equity}
            onChange={(e) =>
              handleAllocationChange("equity", parseInt(e.target.value) || 0)
            }
            min={0}
            max={100}
          />
          <Input
            label="Mutual Funds (%)"
            type="number"
            value={formData.allocationTargets.mf}
            onChange={(e) =>
              handleAllocationChange("mf", parseInt(e.target.value) || 0)
            }
            min={0}
            max={100}
          />
          <Input
            label="Crypto (%)"
            type="number"
            value={formData.allocationTargets.crypto}
            onChange={(e) =>
              handleAllocationChange("crypto", parseInt(e.target.value) || 0)
            }
            min={0}
            max={100}
          />
          <Input
            label="Gold (%)"
            type="number"
            value={formData.allocationTargets.gold}
            onChange={(e) =>
              handleAllocationChange("gold", parseInt(e.target.value) || 0)
            }
            min={0}
            max={100}
          />
          <Input
            label="Real Estate (%)"
            type="number"
            value={formData.allocationTargets.realestate}
            onChange={(e) =>
              handleAllocationChange("realestate", parseInt(e.target.value) || 0)
            }
            min={0}
            max={100}
          />
          <Input
            label="Other (%)"
            type="number"
            value={formData.allocationTargets.other}
            onChange={(e) =>
              handleAllocationChange("other", parseInt(e.target.value) || 0)
            }
            min={0}
            max={100}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={isLoading} disabled={allocationSum !== 100}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
