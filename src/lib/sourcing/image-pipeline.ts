import "server-only";

/**
 * Product imagery from supplier listings — server-only (uses sharp via product-image-store).
 */

import {
  collectSourceImageCandidates,
  isLikelyBrandedImage,
  scoreImageCandidate,
} from "@/lib/sourcing/source-image-scraper";
import { findMarketplaceListingImage } from "@/lib/sourcing/listing-image-finder";
import {
  downloadAndValidateImage,
  enhanceAndStoreProductImage,
} from "@/lib/sourcing/product-image-store";
import { isInvalidProductImageUrl } from "@/lib/sourcing/product-image-url";

export type { ImageResolveInput, ResolvedImage } from "@/lib/sourcing/image-pipeline.types";
export { isStockPlaceholderUrl, isInvalidProductImageUrl } from "@/lib/sourcing/product-image-url";

import type { ImageResolveInput, ResolvedImage } from "@/lib/sourcing/image-pipeline.types";

const MAX_CANDIDATE_TRIES = 12;

export async function verifyImageUrl(url: string): Promise<boolean> {
  if (!url.startsWith("https://")) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return true;

    const getRes = await fetch(url, {
      method: "GET",
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(10000),
    });
    const type = getRes.headers.get("content-type") ?? "";
    return getRes.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

async function rankCandidates(input: ImageResolveInput): Promise<string[]> {
  const candidates = await collectSourceImageCandidates({
    supplierUrl: input.supplierUrl,
    supplierName: input.supplierName,
    candidateUrl: input.candidateUrl,
  });

  return candidates
    .filter((url) => !isLikelyBrandedImage(url, input.supplierName))
    .filter((url) => !isInvalidProductImageUrl(url))
    .sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a));
}

async function pickBestSourceImage(
  input: ImageResolveInput,
): Promise<{ imageUrl: string; listingUrl?: string; bytes: Buffer } | null> {
  if (input.candidateUrl) {
    let validated = await downloadAndValidateImage(input.candidateUrl);
    if (!validated) {
      validated = await downloadAndValidateImage(input.candidateUrl, { relaxed: true });
    }
    if (validated) {
      return { imageUrl: input.candidateUrl, listingUrl: input.supplierUrl, bytes: validated.bytes };
    }
  }

  const ranked = await rankCandidates(input);

  for (const url of ranked.slice(0, MAX_CANDIDATE_TRIES)) {
    const validated = await downloadAndValidateImage(url);
    if (validated) {
      return { imageUrl: url, listingUrl: input.supplierUrl, bytes: validated.bytes };
    }
  }

  const marketplace = await findMarketplaceListingImage(
    input.searchQuery ?? input.name,
    input.name,
    input.supplierName,
    input.supplierUrl,
  );
  if (marketplace) {
    let validated = await downloadAndValidateImage(marketplace.imageUrl);
    if (!validated) {
      validated = await downloadAndValidateImage(marketplace.imageUrl, { relaxed: true });
    }
    if (validated) {
      return {
        imageUrl: marketplace.imageUrl,
        listingUrl: marketplace.listingUrl,
        bytes: validated.bytes,
      };
    }
  }

  return null;
}

export async function resolveProductImage(input: ImageResolveInput): Promise<ResolvedImage> {
  const picked = await pickBestSourceImage(input);
  if (!picked) {
    return { imageUrl: null, enhancedImageUrl: null };
  }

  const stored = await enhanceAndStoreProductImage(
    picked.imageUrl,
    input.slug,
    picked.bytes,
  );
  if (stored) {
    return { ...stored, sourceImageUrl: picked.imageUrl, listingUrl: picked.listingUrl };
  }

  return {
    imageUrl: picked.imageUrl,
    enhancedImageUrl: picked.imageUrl,
    sourceImageUrl: picked.imageUrl,
    listingUrl: picked.listingUrl,
  };
}

export async function resolveProductImagesBatch(
  items: ImageResolveInput[],
): Promise<ResolvedImage[]> {
  return Promise.all(items.map((item) => resolveProductImage(item)));
}
