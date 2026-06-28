"""
Supplier Scrapers — Multi-source product discovery engine.
Searches configured supplier endpoints and aggregates listings.
"""

from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

import httpx

from src.config import config

# Curated supplier catalog — extend with real API integrations
SUPPLIER_SOURCES: list[dict[str, Any]] = [
    {
        "name": "Nordic Home Direct",
        "base_url": "https://example.com/api/nordic",
        "categories": ["sofa", "chair", "table"],
        "trust_score": 4.9,
    },
    {
        "name": "Artisan Loft Co.",
        "base_url": "https://example.com/api/artisan",
        "categories": ["chair", "table", "lamps"],
        "trust_score": 4.7,
    },
    {
        "name": "Studio Essentials",
        "base_url": "https://example.com/api/studio",
        "categories": ["chair", "sofa", "bed"],
        "trust_score": 4.8,
    },
    {
        "name": "FlatPack Pro",
        "base_url": "https://example.com/api/flatpack",
        "categories": ["table", "dressers", "bed"],
        "trust_score": 4.5,
    },
    {
        "name": "Lumen Wholesale",
        "base_url": "https://example.com/api/lumen",
        "categories": ["lamps"],
        "trust_score": 4.6,
    },
]

# Demo product pool for development (simulates scraped results)
DEMO_LISTINGS: list[dict[str, Any]] = [
    {
        "name": "Curved Modular Long Chair",
        "category": "sofa",
        "base_price": 430.0,
        "supplier": "Nordic Home Direct",
        "url": "https://example.com/nordic/long-chair",
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=1000&fit=crop",
        "delivery_days": 7,
        "rating": 4.9,
        "reviews": 284,
    },
    {
        "name": "Minimal Oak Frame Armchair",
        "category": "chair",
        "base_price": 289.0,
        "supplier": "Artisan Loft Co.",
        "url": "https://example.com/artisan/oak-armchair",
        "image": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=600&fit=crop",
        "delivery_days": 5,
        "rating": 4.7,
        "reviews": 156,
    },
    {
        "name": "PureSpace Focus Duo",
        "category": "chair",
        "base_price": 620.0,
        "supplier": "Studio Essentials",
        "url": "https://example.com/studio/purespace",
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
        "delivery_days": 10,
        "rating": 4.9,
        "reviews": 98,
    },
    {
        "name": "Scandinavian Dining Table",
        "category": "table",
        "base_price": 340.0,
        "supplier": "FlatPack Pro",
        "url": "https://example.com/flatpack/scandi-table",
        "image": "https://images.unsplash.com/photo-1617806118773-12e9322a79cf?w=800&h=600&fit=crop",
        "delivery_days": 4,
        "rating": 4.5,
        "reviews": 72,
    },
    {
        "name": "Arc Floor Lamp Matte Black",
        "category": "lamps",
        "base_price": 145.0,
        "supplier": "Lumen Wholesale",
        "url": "https://example.com/lumen/arc-lamp",
        "image": "https://images.unsplash.com/photo-1507473889455-b7bdd792147e?w=800&h=600&fit=crop",
        "delivery_days": 3,
        "rating": 4.6,
        "reviews": 44,
    },
    {
        "name": "Cloud Comfort Bed Frame",
        "category": "bed",
        "base_price": 510.0,
        "supplier": "SleepWell Supply",
        "url": "https://example.com/sleepwell/cloud-bed",
        "image": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
        "delivery_days": 8,
        "rating": 4.8,
        "reviews": 201,
    },
]


@dataclass
class ScrapedListing:
    name: str
    category: str
    base_price: float
    supplier_name: str
    supplier_url: str
    image_url: str
    delivery_days: int
    rating: float
    review_count: int
    availability: str = "in_stock"
    scraped_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "category": self.category,
            "base_price": self.base_price,
            "supplier_name": self.supplier_name,
            "supplier_url": self.supplier_url,
            "image_url": self.image_url,
            "delivery_days": self.delivery_days,
            "rating": self.rating,
            "review_count": self.review_count,
            "availability": self.availability,
            "scraped_at": self.scraped_at,
        }


class SupplierScraper:
    """Orchestrates multi-supplier product discovery."""

    def __init__(self) -> None:
        self.timeout = config.scrape_timeout_seconds
        self.headers = {"User-Agent": config.user_agent}

    async def scrape_supplier_api(
        self, client: httpx.AsyncClient, source: dict[str, Any]
    ) -> list[ScrapedListing]:
        """Attempt to fetch from a supplier API endpoint."""
        try:
            response = await client.get(
                source["base_url"],
                headers=self.headers,
                timeout=self.timeout,
            )
            if response.status_code != 200:
                return []

            data = response.json()
            listings: list[ScrapedListing] = []
            for item in data.get("products", []):
                listings.append(
                    ScrapedListing(
                        name=item["name"],
                        category=item.get("category", "general"),
                        base_price=float(item["price"]),
                        supplier_name=source["name"],
                        supplier_url=item.get("url", source["base_url"]),
                        image_url=item.get("image", ""),
                        delivery_days=item.get("delivery_days", 7),
                        rating=item.get("rating", source["trust_score"]),
                        review_count=item.get("reviews", 0),
                    )
                )
            return listings
        except Exception:
            return []

    def get_demo_listings(
        self,
        category: str | None = None,
        keywords: list[str] | None = None,
        limit: int = 10,
    ) -> list[ScrapedListing]:
        """Return demo listings filtered by intent (development mode)."""
        results = DEMO_LISTINGS.copy()

        if category and category != "general":
            results = [r for r in results if r["category"] == category]

        if keywords:
            results = [
                r
                for r in results
                if any(kw in r["name"].lower() for kw in keywords)
            ] or DEMO_LISTINGS

        random.shuffle(results)
        return [
            ScrapedListing(
                name=r["name"],
                category=r["category"],
                base_price=r["base_price"],
                supplier_name=r["supplier"],
                supplier_url=r["url"],
                image_url=r["image"],
                delivery_days=r["delivery_days"],
                rating=r["rating"],
                review_count=r["reviews"],
            )
            for r in results[:limit]
        ]

    async def search_all_suppliers(
        self,
        category: str | None = None,
        keywords: list[str] | None = None,
    ) -> list[ScrapedListing]:
        """Search all configured suppliers concurrently."""
        async with httpx.AsyncClient() as client:
            tasks = [
                self.scrape_supplier_api(client, source)
                for source in SUPPLIER_SOURCES
                if not category or category in source["categories"]
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

        listings: list[ScrapedListing] = []
        for result in results:
            if isinstance(result, list):
                listings.extend(result)

        if not listings:
            listings = self.get_demo_listings(category, keywords)

        return listings[: config.max_suppliers_per_query]

    def compare_listings(
        self, listings: list[ScrapedListing]
    ) -> dict[str, ScrapedListing | None]:
        """Rank listings into cheapest, fastest, and best quality tiers."""
        if not listings:
            return {"cheapest": None, "fastest": None, "best_quality": None}

        cheapest = min(listings, key=lambda x: x.base_price)
        fastest = min(listings, key=lambda x: x.delivery_days)
        best_quality = max(
            listings,
            key=lambda x: (x.rating * 20 + min(x.review_count, 500) / 50),
        )

        return {
            "cheapest": cheapest,
            "fastest": fastest,
            "best_quality": best_quality,
        }
