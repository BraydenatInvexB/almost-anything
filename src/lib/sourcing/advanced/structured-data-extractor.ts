import "server-only";

import * as cheerio from "cheerio";

export interface StructuredProductData {
  title: string | null;
  price: number | null;
  currency: string | null;
  imageUrl: string | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  description: string | null;
  source: "json-ld" | "open-graph" | "none";
}

function mapAvailability(raw: string | undefined): "in_stock" | "out_of_stock" | "unknown" {
  if (!raw) return "unknown";
  if (raw.includes("InStock")) return "in_stock";
  if (raw.includes("OutOfStock") || raw.includes("SoldOut")) return "out_of_stock";
  return "unknown";
}

function parseJsonLd($: cheerio.CheerioAPI): StructuredProductData | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html();
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const node of candidates) {
        const graph = node["@graph"] ? node["@graph"] : [node];
        for (const item of graph) {
          const type = item["@type"];
          const isProduct =
            type === "Product" || (Array.isArray(type) && type.includes("Product"));
          if (!isProduct) continue;

          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          const images = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];

          return {
            title: item.name ?? null,
            price: offer?.price ? Number(offer.price) : null,
            currency: offer?.priceCurrency ?? null,
            imageUrl: images[0] ?? null,
            availability: mapAvailability(offer?.availability),
            description: item.description ?? null,
            source: "json-ld",
          };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

function parseOpenGraph($: cheerio.CheerioAPI): StructuredProductData | null {
  const title = $('meta[property="og:title"]').attr("content") ?? null;
  const image = $('meta[property="og:image"]').attr("content") ?? null;
  const priceAmount =
    $('meta[property="product:price:amount"]').attr("content") ??
    $('meta[property="og:price:amount"]').attr("content");
  const priceCurrency =
    $('meta[property="product:price:currency"]').attr("content") ??
    $('meta[property="og:price:currency"]').attr("content");
  const description = $('meta[property="og:description"]').attr("content") ?? null;
  const availabilityRaw = $('meta[property="product:availability"]').attr("content");

  if (!title && !image && !priceAmount) return null;

  return {
    title,
    price: priceAmount ? Number(priceAmount) : null,
    currency: priceCurrency ?? null,
    imageUrl: image,
    availability:
      availabilityRaw === "in stock"
        ? "in_stock"
        : availabilityRaw === "out of stock"
          ? "out_of_stock"
          : "unknown",
    description,
    source: "open-graph",
  };
}

export function extractStructuredData(html: string): StructuredProductData {
  const $ = cheerio.load(html);

  const jsonLd = parseJsonLd($);
  if (jsonLd && jsonLd.price !== null && jsonLd.imageUrl !== null) return jsonLd;

  const og = parseOpenGraph($);
  if (og && og.imageUrl !== null) {
    return { ...og, price: og.price ?? jsonLd?.price ?? null };
  }

  return {
    title: null,
    price: null,
    currency: null,
    imageUrl: null,
    availability: "unknown",
    description: null,
    source: "none",
  };
}

export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") ?? "";
    const contentLength = Number(res.headers.get("content-length") ?? "0");
    return contentType.startsWith("image/") && contentLength > 3000;
  } catch {
    return false;
  }
}
