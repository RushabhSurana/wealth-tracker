/**
 * CoinGecko Price Provider
 * Fetches crypto prices from CoinGecko's free public API (no API key required)
 * Includes caching to respect rate limits
 */

import type { PriceData, PriceProvider, PriceCache } from "./types";

// Map common symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  UNI: "uniswap",
  LTC: "litecoin",
  SHIB: "shiba-inu",
};

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, PriceCache>();

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1500; // 1.5 seconds between requests

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
}

export class CoinGeckoProvider implements PriceProvider {
  name = "coingecko";
  supportedTypes = ["crypto"];
  private currency = "inr"; // Default to INR

  constructor(currency: string = "inr") {
    this.currency = currency.toLowerCase();
  }

  async fetchPrice(symbol: string): Promise<PriceData | null> {
    const upperSymbol = symbol.toUpperCase();
    const coingeckoId = SYMBOL_TO_COINGECKO_ID[upperSymbol];

    if (!coingeckoId) {
      return null;
    }

    // Check cache first
    const cached = cache.get(upperSymbol);
    if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      await waitForRateLimit();

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=${this.currency}&include_24hr_change=true`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          `CoinGecko API error: ${response.status} ${response.statusText}`
        );
        return cached?.data ?? null;
      }

      const data = await response.json();
      const priceInfo = data[coingeckoId];

      if (!priceInfo) {
        return null;
      }

      const priceData: PriceData = {
        symbol: upperSymbol,
        price: priceInfo[this.currency] ?? 0,
        changePercent24h: priceInfo[`${this.currency}_24h_change`] ?? 0,
        lastUpdated: new Date(),
        source: this.name,
      };

      // Update cache
      cache.set(upperSymbol, {
        data: priceData,
        fetchedAt: Date.now(),
      });

      return priceData;
    } catch (error) {
      console.error("Error fetching from CoinGecko:", error);
      // Return cached data if available
      return cached?.data ?? null;
    }
  }

  async fetchPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();

    // Filter to only supported symbols
    const supportedSymbols = symbols.filter(
      (s) => SYMBOL_TO_COINGECKO_ID[s.toUpperCase()]
    );

    if (supportedSymbols.length === 0) {
      return results;
    }

    // Check which symbols need fetching
    const needsFetch: string[] = [];
    for (const symbol of supportedSymbols) {
      const upperSymbol = symbol.toUpperCase();
      const cached = cache.get(upperSymbol);
      if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION_MS) {
        results.set(upperSymbol, cached.data);
      } else {
        needsFetch.push(upperSymbol);
      }
    }

    if (needsFetch.length === 0) {
      return results;
    }

    // Batch fetch for efficiency
    const coingeckoIds = needsFetch
      .map((s) => SYMBOL_TO_COINGECKO_ID[s])
      .filter(Boolean)
      .join(",");

    try {
      await waitForRateLimit();

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=${this.currency}&include_24hr_change=true`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          `CoinGecko API error: ${response.status} ${response.statusText}`
        );
        return results;
      }

      const data = await response.json();

      // Map results back to symbols
      for (const symbol of needsFetch) {
        const coingeckoId = SYMBOL_TO_COINGECKO_ID[symbol];
        const priceInfo = data[coingeckoId];

        if (priceInfo) {
          const priceData: PriceData = {
            symbol,
            price: priceInfo[this.currency] ?? 0,
            changePercent24h: priceInfo[`${this.currency}_24h_change`] ?? 0,
            lastUpdated: new Date(),
            source: this.name,
          };

          results.set(symbol, priceData);
          cache.set(symbol, {
            data: priceData,
            fetchedAt: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error batch fetching from CoinGecko:", error);
    }

    return results;
  }

  getSupportedSymbols(): string[] {
    return Object.keys(SYMBOL_TO_COINGECKO_ID);
  }

  clearCache(): void {
    cache.clear();
  }
}

// Export singleton instance
export const coingeckoProvider = new CoinGeckoProvider();
