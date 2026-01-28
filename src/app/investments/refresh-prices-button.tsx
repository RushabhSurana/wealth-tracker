"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { refreshPrices } from "@/lib/actions/prices";

export function RefreshPricesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const result = await refreshPrices();
      setLastRefresh(new Date());
      console.log(`Refreshed ${result.updated} prices`);
    } catch (error) {
      console.error("Failed to refresh prices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {lastRefresh && (
        <span className="text-xs text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
      <Button
        onClick={handleRefresh}
        loading={isLoading}
        size="sm"
        variant="secondary"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh Prices
      </Button>
    </div>
  );
}
