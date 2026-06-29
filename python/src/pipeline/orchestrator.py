"""
Pipeline orchestrator — composable stages for product discovery and ingest.

Stages:
  1. normalize  — query → ProductProfile
  2. discover   — supplier search
  3. polish     — copy humanization + image enhancement
  4. price      — markup + quote tiers
  5. persist    — ingest API or Supabase
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

from src.ai.image_enhancer import ImageEnhancer
from src.core.copy import humanize_product_fields
from src.core.models import ProductProfile, QuoteTier
from src.core.metadata_builder import build_product_metadata
from src.core.normalizer import normalize_profile
from src.scrapers.supplier_scraper import ScrapedListing, SupplierScraper
from src.config import config
from src.services.ingest_client import IngestClient
from src.services.markup_engine import MarkupInput, calculate_markup

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    profile: ProductProfile
    listings: list[dict[str, Any]] = field(default_factory=list)
    comparison: dict[str, ScrapedListing | None] = field(default_factory=dict)
    quotes: list[QuoteTier] = field(default_factory=list)
    ingest: dict[str, Any] = field(default_factory=dict)


class SourcingOrchestrator:
    """Runs the full sourcing pipeline for a single normalized request."""

    def __init__(self, *, enhance_images: bool = True) -> None:
        self.scraper = SupplierScraper()
        self.enhancer = ImageEnhancer() if enhance_images else None
        self.ingest = IngestClient()

    async def run(
        self,
        query: str,
        *,
        category: str | None = None,
        budget: float | None = None,
        urgency: str = "standard",
        input_method: str = "text",
        persist: bool = True,
    ) -> PipelineResult:
        search_category = category or "general"

        logger.info("Parallel intelligence + supplier discovery for: %s", query)
        profile, listings = await asyncio.gather(
            asyncio.to_thread(
                normalize_profile,
                query,
                budget=budget,
                urgency=urgency,
                input_method=input_method,  # type: ignore[arg-type]
            ),
            self.scraper.search_all_suppliers(
                category=search_category,
                keywords=None,
            ),
        )
        search_category = category or profile.product_type
        if not listings:
            listings = await self.scraper.search_all_suppliers(
                category=search_category,
                keywords=profile.keywords or None,
            )
        comparison = self.scraper.compare_listings(listings)

        listing_dicts = [humanize_product_fields(l.to_dict()) for l in listings]
        meta = build_product_metadata(
            profile,
            highlights=profile.attributes[:5] if profile.attributes else None,
            summary=profile.title_hint or query,
            query=query,
        )
        for row in listing_dicts:
            row["metadata"] = meta
            row["variants_config"] = meta.get("variants")
            row["highlights"] = meta.get("highlights", [])
            row["specifications"] = meta.get("specifications", {})
            row["summary"] = meta.get("summary")

        if self.enhancer:
            logger.info("Polishing %d product images", len(listing_dicts))
            listing_dicts = await self.enhancer.batch_enhance(listing_dicts)

        quotes = self._build_quotes(comparison)

        ingest_result: dict[str, Any] = {}
        if persist and listing_dicts:
            if config.internal_api_key:
                ingest_result = await self.ingest.ingest_products(listing_dicts)
            else:
                ingest_result = await self.ingest.ingest_to_supabase_direct(listing_dicts)

        return PipelineResult(
            profile=profile,
            listings=listing_dicts,
            comparison=comparison,
            quotes=quotes,
            ingest=ingest_result,
        )

    def _build_quotes(
        self, comparison: dict[str, ScrapedListing | None]
    ) -> list[QuoteTier]:
        quotes: list[QuoteTier] = []
        for tier, listing in comparison.items():
            if not listing:
                continue
            markup = calculate_markup(
                MarkupInput(
                    base_price=listing.base_price,
                    category=listing.category,
                    supplier_rating=listing.rating,
                )
            )
            quality_score = min(
                100,
                int(listing.rating * 18 + min(listing.review_count, 500) / 10),
            )
            quotes.append(
                QuoteTier(
                    tier=tier,  # type: ignore[arg-type]
                    product_name=listing.name,
                    supplier_name=listing.supplier_name,
                    supplier_url=listing.supplier_url,
                    base_price=listing.base_price,
                    retail_price=markup.retail_price,
                    delivery_days=listing.delivery_days,
                    quality_score=quality_score,
                    rating=listing.rating,
                    image_url=listing.image_url,
                )
            )
        return quotes
