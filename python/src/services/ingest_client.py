"""
Ingest Client — Push sourced products to the Next.js internal API / Supabase.
"""

from __future__ import annotations

from typing import Any

import httpx
from slugify import slugify

from src.config import config
from src.core.copy import humanize_copy
from src.services.markup_engine import MarkupInput, calculate_markup


class IngestClient:
    """Sends processed products to the Almost Anything ingest API."""

    def __init__(self) -> None:
        self.base_url = config.api_base_url.rstrip("/")
        self.api_key = config.internal_api_key
        self.timeout = 60

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
        }

    def prepare_product_payload(
        self, listing: dict[str, Any]
    ) -> dict[str, Any]:
        """Transform a scraped listing into an ingest-ready product record."""
        markup = calculate_markup(
            MarkupInput(
                base_price=listing["base_price"],
                category=listing.get("category", "general"),
                supplier_rating=listing.get("rating", 4.5),
                is_exclusive=listing.get("is_exclusive", False),
            )
        )

        name = humanize_copy(str(listing["name"])).rstrip(".")
        slug_base = slugify(name)
        raw_desc = listing.get(
            "description",
            f"Sourced {name} from {listing.get('supplier_name', 'verified supplier')}.",
        )

        return {
            "slug": slug_base,
            "name": name,
            "description": humanize_copy(str(raw_desc)),
            "category": listing.get("category", "general"),
            "base_price": markup.base_price,
            "image_url": listing.get("image_url"),
            "enhanced_image_url": listing.get("enhanced_image_url"),
            "source_url": listing.get("supplier_url", ""),
            "source_name": listing.get("supplier_name", "Unknown"),
            "delivery_days_min": 5,
            "delivery_days_max": 7,
            "rating": listing.get("rating", 4.5),
            "review_count": listing.get("review_count", 0),
            "is_featured": listing.get("is_featured", False),
            "is_exclusive": listing.get("is_exclusive", False),
            "is_deal": listing.get("is_deal", False),
            "deal_discount_percent": listing.get("deal_discount_percent"),
            "highlights": listing.get("highlights"),
            "specifications": listing.get("specifications"),
            "summary": listing.get("summary"),
            "variants_config": listing.get("variants_config"),
            "metadata": listing.get("metadata"),
        }

    async def ingest_products(
        self, listings: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """POST batch of products to the internal ingest endpoint."""
        if not self.api_key:
            return {
                "success": False,
                "error": "INTERNAL_API_KEY not configured",
                "ingested": 0,
            }

        products = [self.prepare_product_payload(l) for l in listings]

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/internal/ingest",
                json={"products": products},
                headers=self._headers(),
                timeout=self.timeout,
            )

            if response.status_code == 200:
                data = response.json()
                return {"success": True, **data}

            return {
                "success": False,
                "error": response.text,
                "status_code": response.status_code,
                "ingested": 0,
            }

    async def ingest_to_supabase_direct(
        self, listings: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Alternative: write directly to Supabase (bypasses Next.js API)."""
        if not config.supabase_url or not config.supabase_service_key:
            return {"success": False, "error": "Supabase not configured", "ingested": 0}

        from supabase import create_client

        supabase = create_client(config.supabase_url, config.supabase_service_key)
        records = []

        for listing in listings:
            payload = self.prepare_product_payload(listing)
            markup = calculate_markup(
                MarkupInput(
                    base_price=listing["base_price"],
                    category=listing.get("category", "general"),
                    supplier_rating=listing.get("rating", 4.5),
                )
            )
            records.append({
                **payload,
                "retail_price": markup.retail_price,
                "markup_percent": markup.markup_percent,
                "stock_status": "sourced",
            })

        result = supabase.table("products").upsert(records, on_conflict="slug").execute()
        count = len(result.data) if result.data else 0

        return {"success": True, "ingested": count, "method": "supabase_direct"}
