/**
 * Price Provider Aggregator
 * Combines multiple price providers and handles fallback logic
 */

import type { PriceData, PriceProvider } from "./types";
import { mockProvider } from "./mock-provider";
import { coingeckoProvider } from "./coingecko-provider";

export type { PriceData, PriceProvider } from "./types";
export { mockProvider } from "./mock-provider";
export { coingeckoProvider } from "./coingecko-provider";

// Provider priority by asset type
const PROVIDER_PRIORITY: Record<string, PriceProvider[]> = {
  crypto: [coingeckoProvider, mockProvider], // Try real API first, fallback to mock
  equity: [mockProvider], // Only mock for MVP
  mf: [mockProvider],
  gold: [mockProvider],
  default: [mockProvider],
};

// Whether to use real APIs (can be disabled for testing/demo)
let useRealApis = true;

export function setUseRealApis(value: boolean): void {
  useRealApis = value;
}

/**
 * Fetch price for a single symbol
 */
export async function fetchPrice(
  symbol: string,
  assetType: string
): Promise<PriceData | null> {
  const providers = useRealApis
    ? PROVIDER_PRIORITY[assetType] ?? PROVIDER_PRIORITY.default
    : [mockProvider];

  for (const provider of providers) {
    try {
      const price = await provider.fetchPrice(symbol);
      if (price) {
        return price;
      }
    } catch (error) {
      console.error(`Error with provider ${provider.name}:`, error);
      // Continue to next provider
    }
  }

  return null;
}

/**
 * Fetch prices for multiple symbols
 */
export async function fetchPrices(
  assets: { symbol: string; type: string }[]
): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();

  // Group by asset type for efficient batching
  const byType: Record<string, string[]> = {};
  for (const asset of assets) {
    if (!asset.symbol) continue;
    const type = asset.type || "default";
    if (!byType[type]) byType[type] = [];
    byType[type].push(asset.symbol);
  }

  // Fetch each type
  for (const [type, symbols] of Object.entries(byType)) {
    const providers = useRealApis
      ? PROVIDER_PRIORITY[type] ?? PROVIDER_PRIORITY.default
      : [mockProvider];

    const remaining = new Set(symbols);

    for (const provider of providers) {
      if (remaining.size === 0) break;

      try {
        const prices = await provider.fetchPrices([...remaining]);
        for (const [symbol, price] of prices) {
          results.set(symbol, price);
          remaining.delete(symbol);
        }
      } catch (error) {
        console.error(`Error with provider ${provider.name}:`, error);
      }
    }
  }

  return results;
}

/**
 * Start background price refresh
 * Returns a cleanup function to stop the refresh
 */
export function startPriceRefresh(
  symbols: { symbol: string; type: string }[],
  intervalMs: number = 60000, // Default 1 minute
  onUpdate: (prices: Map<string, PriceData>) => void
): () => void {
  let running = true;

  const refresh = async () => {
    if (!running) return;

    try {
      const prices = await fetchPrices(symbols);
      if (running) {
        onUpdate(prices);
      }
    } catch (error) {
      console.error("Price refresh error:", error);
    }

    if (running) {
      setTimeout(refresh, intervalMs);
    }
  };

  // Start immediately
  refresh();

  // Return cleanup function
  return () => {
    running = false;
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format change percentage
 */
export function formatChangePercent(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}
