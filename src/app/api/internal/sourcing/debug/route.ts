import { NextRequest } from "next/server";
import { requireInternalAuth } from "@/lib/security/api";

/**
 * DEBUG ONLY — remove before going to production.
 * Hit this with:
 *   curl -X POST http://localhost:3000/api/internal/sourcing/debug \
 *     -H "Content-Type: application/json" \
 *     -H "x-api-key: YOUR_INTERNAL_API_KEY" \
 *     -d '{"query":"iPhone 16 pro max screen protector"}'
 *
 * Returns a step-by-step breakdown of exactly where the pipeline fails.
 */

export async function POST(request: NextRequest) {
  const authError = requireInternalAuth(request);
  if (authError) return authError;

  const { query } = await request.json();
  if (!query) return Response.json({ error: "query required" }, { status: 400 });

  const log: Record<string, unknown> = { query };

  try {
    // Step 0: Supplier engine (Python) probe
    const { probeSupplierEngine, isSupplierEngineEnabled } = await import(
      "@/lib/sourcing/supplier-engine/run-supplier-engine"
    );
    log.step0_supplier_engine_enabled = isSupplierEngineEnabled();
    if (isSupplierEngineEnabled()) {
      const engineProbe = await probeSupplierEngine(query);
      log.step0_supplier_engine = engineProbe;
    }

    // Step 1: What does searchWholesaleSuppliers actually return?
    const { searchWholesaleSuppliers } = await import("@/lib/sourcing/wholesale-supplier-search");
    const hits = await searchWholesaleSuppliers(query, { maxResults: 12 });
    log.step1_total_hits = hits.length;
    log.step1_hits = hits.slice(0, 6).map(h => ({
      title: h.title,
      domain: h.domain,
      region: h.region,
      tier: h.tier,
      priceZar: h.estimatedPriceZar,
      priceUsd: h.estimatedPriceUsd,
      score: h.score,
    }));

    // Step 2: Price floor check — what does minWholesaleZarForQuery return?
    const { minWholesaleZarForQuery, maxWholesaleZarForQuery, isPlausibleWholesalePrice, isAccessoryListing } =
      await import("@/lib/sourcing/wholesale-listing-quality");
    log.step2_min_price_floor = minWholesaleZarForQuery(query);
    log.step2_max_price_cap = maxWholesaleZarForQuery(query);

    // Step 3: How many hits pass price + accessory filters?
    const { ZAR_PER_USD } = await import("@/lib/pricing/discovery-pricing");
    const pricedHits = hits.filter(h => {
      const priceZar = h.estimatedPriceZar ?? (h.estimatedPriceUsd ? h.estimatedPriceUsd * ZAR_PER_USD : 0);
      return priceZar > 0;
    });
    log.step3_hits_with_price = pricedHits.length;

    const accessoryRejected = hits.filter(h => isAccessoryListing(query, h.title, h.snippet));
    log.step3_accessory_rejected = accessoryRejected.length;
    log.step3_accessory_rejected_titles = accessoryRejected.map(h => h.title);

    const pricePlausible = pricedHits.filter(h => {
      const priceZar = h.estimatedPriceZar ?? (h.estimatedPriceUsd ? h.estimatedPriceUsd * ZAR_PER_USD : 0);
      return isPlausibleWholesalePrice(query, priceZar);
    });
    log.step3_price_plausible = pricePlausible.length;
    log.step3_price_rejected = pricedHits.filter(h => {
      const priceZar = h.estimatedPriceZar ?? (h.estimatedPriceUsd ? h.estimatedPriceUsd * ZAR_PER_USD : 0);
      return !isPlausibleWholesalePrice(query, priceZar);
    }).map(h => ({
      title: h.title,
      priceZar: h.estimatedPriceZar,
      priceUsd: h.estimatedPriceUsd,
    }));

    // Step 4: What does isRelevantProductHit say?
    const { isRelevantProductHit } = await import("@/lib/sourcing/query-relevance");
    const relevantHits = hits.filter(h => isRelevantProductHit(query, h.title, h.snippet, h.url));
    log.step4_relevant_hits = relevantHits.length;
    log.step4_relevant_titles = relevantHits.map(h => h.title);

    // Step 5: Run full extractProductIntelligence and count drafts
    const { extractProductIntelligence } = await import("@/lib/sourcing/product-intelligence");
    const drafts = await extractProductIntelligence(query);
    log.step5_drafts = drafts.length;
    log.step5_draft_names = drafts.map(d => d.name);
    log.step5_draft_prices = drafts.map(d => d.basePrice);

    // Step 6: Google Search grounding (Gemini) status + sample hits
    const { isGoogleSearchConfigured, searchProductZA } = await import(
      "@/lib/sourcing/advanced/google-search"
    );
    log.step6_google_configured = isGoogleSearchConfigured();
    log.step6_google_model = process.env.GOOGLE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    if (isGoogleSearchConfigured()) {
      const googleHits = await searchProductZA(query);
      log.step6_google_hits = googleHits.length;
      log.step6_google_titles = googleHits.slice(0, 6).map((h) => ({
        title: h.title,
        link: h.link,
        displayLink: h.displayLink,
      }));
      if (googleHits.length === 0) {
        const key =
          process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
        const model = process.env.GOOGLE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
        const probe = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key ?? "",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `product listings: ${query}` }] }],
              tools: [{ google_search: {} }],
            }),
          },
        );
        const probeBody = (await probe.json()) as { error?: { message?: string; code?: number } };
        if (!probe.ok) {
          log.step6_google_error = probeBody.error?.message ?? `HTTP ${probe.status}`;
        }
      }
    }

    // Step 7: What does DuckDuckGo actually return raw?
    const { fetchDuckDuckGoMarkdown } = await import("@/lib/sourcing/wholesale-supplier-fetch");
    const rawDdg = await fetchDuckDuckGoMarkdown(`${query} wholesale South Africa trade supplier`);
    log.step7_ddg_raw_length = rawDdg.length;
    log.step7_ddg_has_uddg = rawDdg.includes("uddg=");
    log.step7_ddg_blocked = /429|CAPTCHA|captcha|Too Many Requests/i.test(rawDdg);
    log.step7_ddg_snippet = rawDdg.slice(0, 500);

    // Extract all URLs DDG returned so we can see what's being rejected
    const uddgUrls: string[] = [];
    for (const m of rawDdg.matchAll(/uddg=([^&"')]+)/gi)) {
      try { uddgUrls.push(decodeURIComponent(m[1]).split("?")[0]); } catch { /* skip */ }
    }
    log.step7_all_ddg_urls = uddgUrls;

    // Check which ones are being killed by isRetailPriceSource
    const { isRetailPriceSource } = await import("@/lib/sourcing/wholesale-supplier-url");
    const { domainFromUrl } = await import("@/lib/sourcing/wholesale-supplier-url");
    log.step7_retail_filtered = uddgUrls.map(u => ({
      url: u,
      domain: domainFromUrl(u),
      isRetail: isRetailPriceSource(domainFromUrl(u) ?? ""),
    }));

    const { runSoftGoodsSaSearchPipeline } = await import("@/lib/sourcing/discovery-search-engine");
    const { mapHitToDraft } = await import("@/lib/sourcing/product-intelligence-mappers");
    const saSoftHits = await runSoftGoodsSaSearchPipeline(query);
    log.step8_sa_soft_hits = saSoftHits.length;
    log.step8_sa_soft_sample = saSoftHits.slice(0, 6).map((h) => ({
      title: h.title,
      domain: h.domain,
      priceZar: h.estimatedPriceZar,
      url: h.url,
    }));
    log.step8_sa_soft_drafts = saSoftHits
      .slice(0, 4)
      .map((h, i) => mapHitToDraft(h, query, i, saSoftHits)?.name ?? null);

    const { enrichListingFromUrl } = await import("@/lib/sourcing/listing-page-enricher");
    const seedUrl = "https://kws.sinopool.co.za/product-category/apparel/underwear-sleepwear/";
    const seedEnriched = await enrichListingFromUrl(seedUrl);
    log.step9_sinopool_enrich = seedEnriched
      ? { title: seedEnriched.title, priceZar: seedEnriched.priceZar }
      : null;

  } catch (err) {
    log.error = String(err);
  }

  return Response.json(log, { status: 200 });
}