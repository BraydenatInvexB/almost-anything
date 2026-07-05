#!/usr/bin/env python3
"""
Bridge: run the advanced supplier engine and emit WholesaleSearchHit-compatible JSON.

Usage:
  python run_supplier_engine.py "xbox one x" --max 12 --overseas auto
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from typing import Any
from urllib.parse import urlparse

from supplier_engine.pipeline import run_pipeline


def _domain(url: str | None) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url if "://" in url else f"https://{url}").hostname or ""
        return host.replace("www.", "").lower()
    except Exception:
        return ""


def _tier(supplier_type: str) -> str:
    mapping = {
        "manufacturer": "manufacturer",
        "wholesaler": "wholesale",
        "distributor": "distributor",
        "retailer": "retail",
    }
    return mapping.get(supplier_type, "trade")


def _region(origin: str) -> str:
    return "south_africa" if origin == "local" else "international"


def _vat_status(price_type: str) -> str:
    if price_type == "excl_vat":
        return "ex"
    if price_type == "incl_vat":
        return "incl"
    return "unknown"


def _price_zar_usd(price: float | None, currency: str) -> tuple[float | None, float | None]:
    if price is None or price <= 0:
        return None, None
    cur = (currency or "ZAR").upper()
    if cur in ("ZAR", "R"):
        return round(price, 2), round(price / 18.5, 2)
    if cur in ("USD", "US", "$"):
        return round(price * 18.5, 2), round(price, 2)
    if cur in ("GBP", "EUR"):
        usd = price * (1.27 if cur == "GBP" else 1.08)
        return round(usd * 18.5, 2), round(usd, 2)
    return round(price * 18.5, 2), round(price, 2)


def supplier_to_hit(s: Any) -> dict[str, Any]:
    url = s.source_url or s.contact.website or ""
    product = s.product
    title = product.name or s.company_name
    snippet = s.discovery_snippet or (product.description or "")[:400]
    zar, usd = _price_zar_usd(product.price, product.currency)

    highlights: list[str] = []
    if product.features:
        highlights.extend(product.features[:6])
    if s.profile.cipc_verified:
        highlights.append("CIPC verified")
    if s.profile.website_alive:
        highlights.append("Website verified")
    if s.profile.ships_to_sa:
        highlights.append("Ships to South Africa")
    if product.delivery_estimate:
        highlights.append(f"Delivery: {product.delivery_estimate}")

    score = round((s.score.total or 0) * 140 + 40)
    if s.profile.cipc_verified:
        score += 25
    if s.profile.website_alive:
        score += 15
    if s.extraction_confidence >= 0.5:
        score += 20
    if zar:
        score += 30

    return {
        "title": title,
        "url": url,
        "snippet": snippet,
        "domain": _domain(url),
        "region": _region(s.profile.origin),
        "tier": _tier(s.profile.supplier_type.value),
        "estimatedPriceZar": zar,
        "estimatedPriceUsd": usd,
        "supplierMoq": product.min_order_quantity,
        "priceVatStatus": _vat_status(product.price_type.value),
        "listingDescription": product.description,
        "listingSummary": snippet[:240] if snippet else None,
        "listingHighlights": highlights or None,
        "score": score,
        "_engine": {
            "company": s.company_name,
            "supplierType": s.profile.supplier_type.value,
            "origin": s.profile.origin,
            "cipcVerified": s.profile.cipc_verified,
            "shipsToSa": s.profile.ships_to_sa,
            "extractionConfidence": s.extraction_confidence,
            "directorySource": s.profile.directory_source,
        },
    }


async def run_search(
    query: str,
    *,
    category: str | None,
    location: str,
    max_results: int,
    overseas: str,
) -> list[dict[str, Any]]:
    suppliers = await run_pipeline(
        query,
        category=category,
        location=location,
        max_suppliers=max_results,
        region="za",
        overseas=overseas,
    )
    hits = [supplier_to_hit(s) for s in suppliers if s.source_url or s.contact.website]
    hits.sort(key=lambda h: h.get("score", 0), reverse=True)
    return hits


def main() -> None:
    parser = argparse.ArgumentParser(description="Run supplier engine for Almost Anything discovery")
    parser.add_argument("query", help="Product search query")
    parser.add_argument("--category", "-c", default=None)
    parser.add_argument("--location", "-l", default="South Africa")
    parser.add_argument("--max", "-m", type=int, default=12)
    parser.add_argument(
        "--overseas",
        default="auto",
        choices=["auto", "yes", "no", "only"],
        help="Overseas supplier search mode",
    )
    args = parser.parse_args()

    try:
        hits = asyncio.run(
            run_search(
                args.query.strip(),
                category=args.category,
                location=args.location,
                max_results=max(1, min(args.max, 20)),
                overseas=args.overseas,
            )
        )
        json.dump({"ok": True, "hits": hits, "count": len(hits)}, sys.stdout, default=str)
    except Exception as exc:
        json.dump({"ok": False, "error": str(exc), "hits": []}, sys.stdout, default=str)
        sys.exit(1)


if __name__ == "__main__":
    main()
