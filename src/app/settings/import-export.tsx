"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { exportData, importData } from "@/lib/actions/data-transfer";

export function ImportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthtracker-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("Data exported successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      setSuccess("Data imported successfully! Refresh the page to see changes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
          <p className="text-sm text-gray-500 mb-4">
            Download all your financial data as a JSON file for backup or transfer.
          </p>
          <Button onClick={handleExport} loading={isExporting} variant="secondary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export JSON
          </Button>
        </div>

        {/* Import */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Import Data</h4>
          <p className="text-sm text-gray-500 mb-4">
            Import data from a previously exported JSON file. This will merge with
            existing data.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={handleImportClick}
            loading={isImporting}
            variant="secondary"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import JSON
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-4">
        <p>
          <strong>Note:</strong> Import will add new records and skip existing ones
          based on name matching. It will not delete any existing data.
        </p>
      </div>
    </div>
  );
}
