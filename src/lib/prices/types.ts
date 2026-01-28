/**
 * Price Provider Types
 */

export interface PriceData {
  symbol: string;
  price: number;
  change24h?: number;
  changePercent24h?: number;
  lastUpdated: Date;
  source: string;
}

export interface PriceProvider {
  name: string;
  supportedTypes: string[];
  fetchPrice(symbol: string): Promise<PriceData | null>;
  fetchPrices(symbols: string[]): Promise<Map<string, PriceData>>;
}

export interface PriceCache {
  data: PriceData;
  fetchedAt: number;
}
