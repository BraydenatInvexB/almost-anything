export type ImageResolveInput = {
  name: string;
  slug: string;
  category: string;
  supplierUrl: string;
  supplierName: string;
  candidateUrl?: string;
  searchQuery?: string;
};

export type ResolvedImage = {
  imageUrl: string | null;
  enhancedImageUrl: string | null;
  sourceImageUrl?: string;
  listingUrl?: string;
};
