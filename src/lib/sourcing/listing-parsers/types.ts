export type EnrichedListing = {
  title: string;
  priceZar: number;
  imageUrl?: string;
  description?: string;
  summary?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
};
