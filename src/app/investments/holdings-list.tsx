"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatPercent, getAssetTypeLabel, cn } from "@/lib/utils";
import { createHolding, updateHolding, deleteHolding, type HoldingInput } from "@/lib/actions/holdings";
import { createAsset, type AssetInput } from "@/lib/actions/assets";
import type { HoldingWithPrice } from "@/lib/types";

interface Asset {
  id: string;
  name: string;
  type: string;
  symbol: string | null;
}

interface HoldingsListProps {
  holdings: HoldingWithPrice[];
  assets: Asset[];
}

const assetTypes = [
  { value: "equity", label: "Equity" },
  { value: "mf", label: "Mutual Fund" },
  { value: "crypto", label: "Crypto" },
  { value: "gold", label: "Gold" },
  { value: "realestate", label: "Real Estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "custom", label: "Other" },
];

export function HoldingsList({ holdings, assets }: HoldingsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewAssetMode, setIsNewAssetMode] = useState(false);
  const [editingItem, setEditingItem] = useState<HoldingWithPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [holdingData, setHoldingData] = useState<HoldingInput>({
    assetId: "",
    units: 0,
    avgCost: 0,
  });

  const [assetData, setAssetData] = useState<AssetInput>({
    name: "",
    type: "equity",
    symbol: "",
    currency: "INR",
    notes: "",
  });

  const openAddModal = () => {
    setEditingItem(null);
    setIsNewAssetMode(false);
    setHoldingData({
      assetId: assets[0]?.id || "",
      units: 0,
      avgCost: 0,
    });
    setAssetData({
      name: "",
      type: "equity",
      symbol: "",
      currency: "INR",
      notes: "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: HoldingWithPrice) => {
    setEditingItem(item);
    setIsNewAssetMode(false);
    setHoldingData({
      assetId: item.assetId,
      units: item.units,
      avgCost: item.avgCost,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let assetId = holdingData.assetId;

      // Create new asset if in new asset mode
      if (isNewAssetMode) {
        const newAsset = await createAsset(assetData);
        assetId = newAsset.id;
      }

      const finalData = { ...holdingData, assetId };

      if (editingItem) {
        await updateHolding(editingItem.id, finalData);
      } else {
        await createHolding(finalData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holding?")) return;

    setIsLoading(true);
    try {
      await deleteHolding(id);
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
          Add Holding
        </Button>
      </div>

      {holdings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No holdings yet</p>
          <p className="text-sm">Add your first investment</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead align="right">Units</TableHead>
                <TableHead align="right">Avg Cost</TableHead>
                <TableHead align="right">Current</TableHead>
                <TableHead align="right">Value</TableHead>
                <TableHead align="right">P&L</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{holding.assetName}</p>
                      {holding.symbol && (
                        <p className="text-xs text-gray-500">{holding.symbol}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {getAssetTypeLabel(holding.assetType)}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    {holding.units.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(holding.avgCost)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(holding.currentPrice)}
                  </TableCell>
                  <TableCell align="right" className="font-medium">
                    {formatCurrency(holding.currentValue)}
                  </TableCell>
                  <TableCell align="right">
                    <div className={cn(
                      "font-medium",
                      holding.pnl >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(holding.pnl)}
                      <span className="text-xs block">
                        {formatPercent(holding.pnlPercent)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(holding)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(holding.id)}
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
        title={editingItem ? "Edit Holding" : "Add Holding"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {!editingItem && (
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={!isNewAssetMode ? "primary" : "secondary"}
                size="sm"
                onClick={() => setIsNewAssetMode(false)}
              >
                Existing Asset
              </Button>
              <Button
                type="button"
                variant={isNewAssetMode ? "primary" : "secondary"}
                size="sm"
                onClick={() => setIsNewAssetMode(true)}
              >
                New Asset
              </Button>
            </div>
          )}

          {isNewAssetMode && !editingItem ? (
            <>
              <Input
                label="Asset Name"
                value={assetData.name}
                onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                required
                placeholder="e.g., Apple Inc"
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  value={assetData.type}
                  onChange={(e) => setAssetData({ ...assetData, type: e.target.value as AssetInput["type"] })}
                  options={assetTypes}
                />

                <Input
                  label="Symbol (optional)"
                  value={assetData.symbol || ""}
                  onChange={(e) => setAssetData({ ...assetData, symbol: e.target.value })}
                  placeholder="e.g., AAPL, BTC"
                />
              </div>
            </>
          ) : (
            <Select
              label="Asset"
              value={holdingData.assetId}
              onChange={(e) => setHoldingData({ ...holdingData, assetId: e.target.value })}
              options={assets.map(a => ({
                value: a.id,
                label: `${a.name}${a.symbol ? ` (${a.symbol})` : ''}`,
              }))}
              disabled={!!editingItem}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Units"
              type="number"
              value={holdingData.units || ""}
              onChange={(e) => setHoldingData({ ...holdingData, units: parseFloat(e.target.value) || 0 })}
              required
              min={0}
              step="any"
              helpText="Number of shares/units"
            />

            <Input
              label="Average Cost"
              type="number"
              value={holdingData.avgCost || ""}
              onChange={(e) => setHoldingData({ ...holdingData, avgCost: parseFloat(e.target.value) || 0 })}
              required
              min={0}
              step="any"
              helpText="Per unit cost"
            />
          </div>

          {holdingData.units > 0 && holdingData.avgCost > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-600">
                Cost Basis: {formatCurrency(holdingData.units * holdingData.avgCost)}
              </p>
            </div>
          )}

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
