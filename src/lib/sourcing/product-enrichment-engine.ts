import "server-only";

/**
 * product-enrichment-engine.ts
 *
 * This fixes the core problem: wrong product names, bad descriptions,
 * missing features, and wrong images.
 *
 * Root cause of all four issues was the same: product copy and images
 * were being built from 160-character DuckDuckGo search snippets, not
 * from the actual product page. This file fixes that by:
 *
 * 1. Going directly to the winning supplier URL and reading real page content
 * 2. Structured data first (JSON-LD / og:image) — deterministic, not guessed
 * 3. Claude reads the actual page HTML to generate proper name, description,
 *    key features, specs, colours and variants — not DuckDuckGo snippet text
 * 4. Image is validated as a real loadable image before being committed
 *
 * Called from discovery-engine.ts after extractProductIntelligence() returns
 * drafts, before persistDiscoveredProducts().
 */

import { extractStructuredData } from "@/lib/sourcing/advanced/structured-data-extractor";
import { validateImageUrl } from "@/lib/sourcing/advanced/structured-data-extractor";
import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";
import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-mappers";

const USER_AGENT = "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0)";
const JINA_READER = "https://r.jina.ai/";

// ─── Page fetching ────────────────────────────────────────────────────────────

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const res = await fetch(`${JINA_READER}${url}`, {
      headers: { Accept: "text/plain", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(18000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (/429|CAPTCHA|captcha|Too Many Requests/i.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}

// ─── Image resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the best product image from the supplier page.
 * Priority: JSON-LD → og:image → twitter:image → validated AI-extracted URL.
 * Always validates the URL resolves to a real image before returning it.
 */
async function resolveProductImage(
  html: string | null,
  pageUrl: string,
  candidateFromHit?: string,
): Promise<string | null> {
  // 1. Structured data — most reliable source
  if (html) {
    const structured = extractStructuredData(html);
    if (structured.imageUrl) {
      const valid = await validateImageUrl(structured.imageUrl);
      if (valid) return structured.imageUrl;
    }
  }

  // 2. Candidate URL from the hit (came from listing parser or JSON-LD on a previous pass)
  if (candidateFromHit) {
    const valid = await validateImageUrl(candidateFromHit);
    if (valid) return candidateFromHit;
  }

  return null;
}

// ─── LLM copy generation ──────────────────────────────────────────────────────

interface EnrichedCopy {
  name: string;
  description: string;
  summary: string;
  highlights: string[];
  specifications: Record<string, string>;
  colours: string[];
  variants: string[];
}

const COPY_SYSTEM = `You write clean, accurate product copy for a South African ecommerce store from real supplier page content.

Rules:
- Product NAME: Brand + model + key spec only. No supplier names, no domain names, no "wholesale", no "MOQ", no hype. Max 80 chars.
- DESCRIPTION: 2–3 short factual sentences about what the product IS and does. No marketing fluff. No em dashes.
- SUMMARY: One clear sentence. Max 120 chars.
- HIGHLIGHTS: 3–5 short factual bullet points about actual features (specs, what's in the box, compatibility, etc.).
- SPECIFICATIONS: Key technical specs as key/value pairs (e.g. "Storage": "128GB", "Display": "11-inch Liquid Retina").
- COLOURS: List colour options if the listing mentions them, else [].
- VARIANTS: List storage/size/model variants if mentioned, else [].

CRITICAL:
- Only use information that appears in the page content. Never invent specs.
- If a generation or year is in the original query (e.g. "2020"), it MUST appear in the name.
- Never use supplier name, domain, or "available to order" as description content.

Output ONLY valid JSON:
{
  "name": string,
  "description": string,
  "summary": string,
  "highlights": string[],
  "specifications": { [key: string]: string },
  "colours": string[],
  "variants": string[]
}`;

async function generateCopyFromPageContent(
  pageContent: string,
  originalQuery: string,
  existingTitle: string,
): Promise<EnrichedCopy | null> {
  if (!llmConfigured()) return null;

  const prompt = `ORIGINAL CUSTOMER SEARCH: "${originalQuery}"
EXISTING TITLE FROM SUPPLIER: "${existingTitle}"

PAGE CONTENT (from supplier listing):
${pageContent.slice(0, 20000)}`;

  try {
    const data = await llmCompleteJson(COPY_SYSTEM, prompt, "anthropic");
    if (!data.name || typeof data.name !== "string") return null;

    return {
      name: String(data.name).slice(0, 120),
      description:
        typeof data.description === "string" ? data.description : `${data.name} available to order.`,
      summary:
        typeof data.summary === "string"
          ? data.summary
          : String(data.name),
      highlights: Array.isArray(data.highlights)
        ? data.highlights.filter((h): h is string => typeof h === "string").slice(0, 6)
        : [],
      specifications:
        data.specifications && typeof data.specifications === "object"
          ? Object.fromEntries(
              Object.entries(data.specifications as Record<string, unknown>).filter(
                (e): e is [string, string] => typeof e[1] === "string",
              ),
            )
          : {},
      colours: Array.isArray(data.colours)
        ? data.colours.filter((c): c is string => typeof c === "string")
        : [],
      variants: Array.isArray(data.variants)
        ? data.variants.filter((v): v is string => typeof v === "string")
        : [],
    };
  } catch {
    return null;
  }
}

// ─── Main enrichment function ─────────────────────────────────────────────────

/**
 * Takes a draft product (built from a DuckDuckGo snippet) and enriches it
 * by going directly to the supplier page, reading real content, and using
 * Claude to generate accurate copy and a validated image.
 *
 * Falls back gracefully — if enrichment fails the original draft is returned
 * unchanged so the pipeline never hard-fails because of this step.
 */
export async function enrichDraftFromSupplierPage(
  draft: DiscoveredProductDraft,
  originalQuery: string,
): Promise<DiscoveredProductDraft> {
  if (!draft.supplierUrl) return draft;

  // Fetch the actual page — try direct first, Jina as fallback (for JS-rendered pages)
  let html = await fetchPageHtml(draft.supplierUrl);
  let pageContent = html;

  // If direct fetch gives us something usable, great. If not, try Jina for markdown.
  if (!html || html.length < 500) {
    const jinaMarkdown = await fetchViaJina(draft.supplierUrl);
    if (jinaMarkdown && jinaMarkdown.length > 300) {
      pageContent = jinaMarkdown;
      // We still want HTML for structured data extraction
      if (!html) html = null;
    }
  }

  if (!pageContent || pageContent.length < 100) return draft;

  // 1. Resolve the real product image from structured data on the actual page
  const resolvedImage = await resolveProductImage(html, draft.supplierUrl, draft.candidateImageUrl);

  // 2. Generate accurate copy from the real page content
  const enrichedCopy = await generateCopyFromPageContent(
    pageContent,
    originalQuery,
    draft.name,
  );

  if (!enrichedCopy) {
    // Copy generation failed — at least update the image if we got a better one
    if (resolvedImage) {
      return { ...draft, candidateImageUrl: resolvedImage };
    }
    return draft;
  }

  // 3. Merge enriched copy over draft — keep original price, category, supplier info
  return {
    ...draft,
    name: enrichedCopy.name,
    description: enrichedCopy.description,
    summary: enrichedCopy.summary,
    highlights: enrichedCopy.highlights.length ? enrichedCopy.highlights : draft.highlights,
    specifications:
      Object.keys(enrichedCopy.specifications).length
        ? enrichedCopy.specifications
        : draft.specifications,
    colours: enrichedCopy.colours.length ? enrichedCopy.colours : draft.colours,
    candidateImageUrl: resolvedImage ?? draft.candidateImageUrl,
  };
}

/**
 * Batch enrichment for multiple drafts.
 * Runs enrichment concurrently (max 3 at a time to avoid rate limiting),
 * returns all drafts — enriched where possible, original where not.
 */
export async function enrichDraftsBatch(
  drafts: DiscoveredProductDraft[],
  originalQuery: string,
  concurrency = 3,
): Promise<DiscoveredProductDraft[]> {
  const results: DiscoveredProductDraft[] = new Array(drafts.length);

  for (let i = 0; i < drafts.length; i += concurrency) {
    const batch = drafts.slice(i, i + concurrency);
    const enriched = await Promise.allSettled(
      batch.map((draft) => enrichDraftFromSupplierPage(draft, originalQuery)),
    );
    for (let j = 0; j < enriched.length; j++) {
      const outcome = enriched[j];
      results[i + j] =
        outcome.status === "fulfilled" ? outcome.value : batch[j];
    }
  }

  return results;
}
