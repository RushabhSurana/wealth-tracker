/**
 * Mock Price Provider
 * Provides realistic mock prices with random walk updates
 * Perfect for development and demo without external API dependencies
 */

import type { PriceData, PriceProvider } from "./types";

// Base prices for various assets (in INR for India-friendly amounts)
const BASE_PRICES: Record<string, { price: number; volatility: number }> = {
  // Indian Stocks (NSE)
  RELIANCE: { price: 2450, volatility: 0.02 },
  TCS: { price: 3850, volatility: 0.015 },
  HDFCBANK: { price: 1650, volatility: 0.018 },
  INFY: { price: 1480, volatility: 0.02 },
  ICICIBANK: { price: 1120, volatility: 0.02 },
  SBIN: { price: 780, volatility: 0.025 },
  BHARTIARTL: { price: 1580, volatility: 0.02 },
  ITC: { price: 465, volatility: 0.015 },
  KOTAKBANK: { price: 1780, volatility: 0.018 },
  LT: { price: 3450, volatility: 0.02 },
  ASIANPAINT: { price: 2850, volatility: 0.018 },
  WIPRO: { price: 485, volatility: 0.022 },
  TATASTEEL: { price: 142, volatility: 0.03 },
  MARUTI: { price: 12500, volatility: 0.02 },

  // US Stocks (in INR equivalent)
  AAPL: { price: 15200, volatility: 0.025 },
  GOOGL: { price: 14800, volatility: 0.028 },
  MSFT: { price: 35200, volatility: 0.022 },
  AMZN: { price: 15800, volatility: 0.03 },
  TSLA: { price: 20500, volatility: 0.05 },
  NVDA: { price: 9800, volatility: 0.04 },
  META: { price: 48500, volatility: 0.035 },

  // Crypto (in INR)
  BTC: { price: 7250000, volatility: 0.04 },
  ETH: { price: 285000, volatility: 0.045 },
  SOL: { price: 15800, volatility: 0.06 },
  BNB: { price: 52000, volatility: 0.04 },
  XRP: { price: 185, volatility: 0.05 },
  ADA: { price: 78, volatility: 0.055 },
  DOGE: { price: 28, volatility: 0.08 },
  DOT: { price: 620, volatility: 0.05 },
  MATIC: { price: 68, volatility: 0.06 },
  LINK: { price: 1850, volatility: 0.045 },

  // Gold (per gram in INR)
  GOLD: { price: 7250, volatility: 0.008 },
  SILVER: { price: 92, volatility: 0.015 },

  // Mutual Funds (NAV in INR)
  "AXIS-BLUECHIP": { price: 52.5, volatility: 0.012 },
  "HDFC-FLEXICAP": { price: 1580, volatility: 0.015 },
  "SBI-SMALLCAP": { price: 168, volatility: 0.025 },
  "ICICI-TECH": { price: 185, volatility: 0.022 },
  "PARAG-FLEXI": { price: 62, volatility: 0.018 },
  "MIRAE-EMERGING": { price: 125, volatility: 0.02 },
  "NIPPON-LIQUID": { price: 5250, volatility: 0.001 },
  "UTI-NIFTY50": { price: 145, volatility: 0.015 },
};

// Store current prices (simulated state)
const currentPrices: Map<string, { price: number; lastChange: number }> =
  new Map();

// Initialize prices
function initializePrices() {
  for (const [symbol, data] of Object.entries(BASE_PRICES)) {
    currentPrices.set(symbol, { price: data.price, lastChange: 0 });
  }
}

// Apply random walk to simulate price movement
function applyRandomWalk(symbol: string): void {
  const baseData = BASE_PRICES[symbol];
  if (!baseData) return;

  const current = currentPrices.get(symbol);
  if (!current) {
    currentPrices.set(symbol, { price: baseData.price, lastChange: 0 });
    return;
  }

  // Random walk with mean reversion
  const randomFactor = (Math.random() - 0.5) * 2 * baseData.volatility;
  const meanReversion =
    (baseData.price - current.price) / baseData.price * 0.1;
  const change = randomFactor + meanReversion;

  const newPrice = current.price * (1 + change);
  const priceChange = newPrice - current.price;

  currentPrices.set(symbol, {
    price: newPrice,
    lastChange: priceChange,
  });
}

// Initialize on module load
initializePrices();

export class MockPriceProvider implements PriceProvider {
  name = "mock";
  supportedTypes = ["equity", "mf", "crypto", "gold"];

  async fetchPrice(symbol: string): Promise<PriceData | null> {
    const upperSymbol = symbol.toUpperCase();

    // Apply random walk to simulate "live" updates
    applyRandomWalk(upperSymbol);

    const priceData = currentPrices.get(upperSymbol);
    if (!priceData) {
      return null;
    }

    const baseData = BASE_PRICES[upperSymbol];
    const changePercent = baseData
      ? ((priceData.price - baseData.price) / baseData.price) * 100
      : 0;

    return {
      symbol: upperSymbol,
      price: Math.round(priceData.price * 100) / 100,
      change24h: Math.round(priceData.lastChange * 100) / 100,
      changePercent24h: Math.round(changePercent * 100) / 100,
      lastUpdated: new Date(),
      source: this.name,
    };
  }

  async fetchPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();

    for (const symbol of symbols) {
      const price = await this.fetchPrice(symbol);
      if (price) {
        results.set(symbol.toUpperCase(), price);
      }
    }

    return results;
  }

  // Get all available symbols
  getAvailableSymbols(): string[] {
    return Object.keys(BASE_PRICES);
  }

  // Reset prices to base values
  resetPrices(): void {
    initializePrices();
  }

  // Manually set a price (for testing)
  setPrice(symbol: string, price: number): void {
    currentPrices.set(symbol.toUpperCase(), { price, lastChange: 0 });
  }
}

// Export singleton instance
export const mockProvider = new MockPriceProvider();
