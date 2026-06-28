#!/usr/bin/env python3
"""
Almost Anything — Sourcing Pipeline Orchestrator

Full workflow:
  1. Parse customer intent (AI)
  2. Search suppliers (Python scrapers)
  3. Compare price, stock, delivery, reviews
  4. Enhance product images (AI)
  5. Apply markup engine
  6. Ingest to Supabase via secure API

Usage:
  python main.py                          # Run full catalog sync
  python main.py --query "minimal sofa"   # Source specific product
  python main.py --category chair         # Source by category
  python main.py --watch                  # Continuous monitoring mode
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.ai.image_enhancer import ImageEnhancer
from src.ai.product_understanding import parse_intent_ai
from src.config import config
from src.scrapers.supplier_scraper import SupplierScraper
from src.services.ingest_client import IngestClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("almostanything")


async def run_sourcing_pipeline(
    query: str | None = None,
    category: str | None = None,
    enhance_images: bool = True,
) -> dict:
    """Execute the full sourcing pipeline."""
    logger.info("Starting Almost Anything sourcing pipeline")

    config_errors = config.validate()
    if config_errors:
        logger.warning("Config warnings: %s", ", ".join(config_errors))

    intent = None
    if query:
        logger.info("Parsing intent for: %s", query)
        intent = parse_intent_ai(query)
        category = category or intent.product_type
        logger.info(
            "Intent: type=%s, keywords=%s, attributes=%s",
            intent.product_type,
            intent.keywords,
            intent.attributes,
        )

    scraper = SupplierScraper()
    logger.info("Searching suppliers (category=%s)...", category or "all")
    listings = await scraper.search_all_suppliers(
        category=category,
        keywords=intent.keywords if intent else None,
    )
    logger.info("Found %d listings", len(listings))

    comparison = scraper.compare_listings(listings)
    for tier, listing in comparison.items():
        if listing:
            logger.info(
                "  %s: %s @ $%.2f (%d days, %.1f★)",
                tier,
                listing.name,
                listing.base_price,
                listing.delivery_days,
                listing.rating,
            )

    listing_dicts = [l.to_dict() for l in listings]

    if enhance_images:
        logger.info("Enhancing product images...")
        enhancer = ImageEnhancer()
        listing_dicts = await enhancer.batch_enhance(listing_dicts)

    ingest = IngestClient()
    logger.info("Ingesting products to store...")

    if config.internal_api_key:
        result = await ingest.ingest_products(listing_dicts)
    else:
        result = await ingest.ingest_to_supabase_direct(listing_dicts)

    logger.info("Ingest result: %s", json.dumps(result, indent=2))

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "category": category,
        "listings_found": len(listings),
        "comparison": {
            tier: l.to_dict() if l else None
            for tier, l in comparison.items()
        },
        "ingest": result,
    }


async def watch_mode(interval_minutes: int = 60) -> None:
    """Continuously monitor suppliers for new products and price changes."""
    import schedule
    import time

    logger.info("Starting watch mode (interval=%d min)", interval_minutes)

    def job() -> None:
        asyncio.run(run_sourcing_pipeline())

    schedule.every(interval_minutes).minutes.do(job)
    job()

    while True:
        schedule.run_pending()
        time.sleep(30)


def main() -> None:
    parser = argparse.ArgumentParser(description="Almost Anything Sourcing Engine")
    parser.add_argument("--query", "-q", help="Customer search query")
    parser.add_argument("--category", "-c", help="Product category filter")
    parser.add_argument("--watch", "-w", action="store_true", help="Continuous monitoring")
    parser.add_argument("--interval", type=int, default=60, help="Watch interval (minutes)")
    parser.add_argument("--no-enhance", action="store_true", help="Skip image enhancement")

    args = parser.parse_args()

    if args.watch:
        asyncio.get_event_loop().run_until_complete(
            watch_mode(args.interval)
        )
    else:
        result = asyncio.run(
            run_sourcing_pipeline(
                query=args.query,
                category=args.category,
                enhance_images=not args.no_enhance,
            )
        )
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
