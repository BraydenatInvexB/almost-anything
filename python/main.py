#!/usr/bin/env python3
"""
Almost Anything — Sourcing Pipeline Orchestrator

Usage:
  python main.py                              # Full catalog sync
  python main.py --query "minimal oak sofa"   # Source from search query
  python main.py --category chair             # Source by category
  python main.py --request-id REQ-xxx         # Process item request + quotes
  python main.py --process-pending            # Process next queued sourcing run
  python main.py --watch                      # Continuous monitoring mode
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

from src.config import config
from src.pipeline.orchestrator import SourcingOrchestrator
from src.pipeline.request_processor import process_customer_request, process_pending_run

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("almostanything")


async def run_catalog_pipeline(
    query: str | None = None,
    category: str | None = None,
    enhance_images: bool = True,
) -> dict:
    """Execute catalog ingest pipeline (storefront products)."""
    logger.info("Starting catalog sourcing pipeline")
    config_errors = config.validate()
    if config_errors:
        logger.warning("Config warnings: %s", ", ".join(config_errors))

    orchestrator = SourcingOrchestrator(enhance_images=enhance_images)
    result = await orchestrator.run(
        query or category or "featured catalog",
        category=category,
        input_method="text",
        persist=True,
    )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "catalog",
        "query": query,
        "category": category,
        "profile": result.profile.to_dict(),
        "listings_found": len(result.listings),
        "quotes": [q.model_dump() for q in result.quotes],
        "ingest": result.ingest,
    }


async def watch_mode(interval_minutes: int = 60) -> None:
    """Continuously monitor suppliers and process pending item requests."""
    import schedule
    import time

    logger.info("Starting watch mode (interval=%d min)", interval_minutes)

    def job() -> None:
        asyncio.run(run_catalog_pipeline())
        asyncio.run(process_pending_run())

    schedule.every(interval_minutes).minutes.do(job)
    job()

    while True:
        schedule.run_pending()
        time.sleep(30)


def main() -> None:
    parser = argparse.ArgumentParser(description="Almost Anything Sourcing Engine")
    parser.add_argument("--query", "-q", help="Customer search query")
    parser.add_argument("--category", "-c", help="Product category filter")
    parser.add_argument("--request-id", "-r", help="Process a customer item request")
    parser.add_argument(
        "--process-pending",
        action="store_true",
        help="Process the next pending sourcing run from the queue",
    )
    parser.add_argument("--watch", "-w", action="store_true", help="Continuous monitoring")
    parser.add_argument("--interval", type=int, default=60, help="Watch interval (minutes)")
    parser.add_argument("--no-enhance", action="store_true", help="Skip image enhancement")

    args = parser.parse_args()
    enhance = not args.no_enhance

    if args.watch:
        asyncio.get_event_loop().run_until_complete(watch_mode(args.interval))
        return

    if args.request_id:
        result = asyncio.run(
            process_customer_request(args.request_id, enhance_images=enhance)
        )
    elif args.process_pending:
        result = asyncio.run(process_pending_run(enhance_images=enhance))
    else:
        result = asyncio.run(
            run_catalog_pipeline(
                query=args.query,
                category=args.category,
                enhance_images=enhance,
            )
        )

    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
