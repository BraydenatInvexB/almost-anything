"""Supabase persistence for the sourcing pipeline."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.config import config
from src.core.models import ProductProfile, QuoteTier


class SupabaseRepository:
    """Read/write sourcing data directly to Supabase."""

    def __init__(self) -> None:
        if not config.supabase_url or not config.supabase_service_key:
            raise RuntimeError("Supabase is not configured")
        from supabase import create_client

        self._client = create_client(config.supabase_url, config.supabase_service_key)

    def get_customer_request(self, request_id: str) -> dict[str, Any] | None:
        result = (
            self._client.table("customer_requests")
            .select("*")
            .eq("id", request_id)
            .maybe_single()
            .execute()
        )
        return result.data

    def update_request_status(
        self,
        request_id: str,
        status: str,
        *,
        parsed_intent: dict | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if parsed_intent is not None:
            payload["parsed_intent"] = parsed_intent
        self._client.table("customer_requests").update(payload).eq("id", request_id).execute()

    def claim_pending_run(self, run_id: str | None = None) -> dict[str, Any] | None:
        query = (
            self._client.table("sourcing_runs")
            .select("*")
            .eq("status", "pending")
            .order("started_at")
            .limit(1)
        )
        if run_id:
            query = (
                self._client.table("sourcing_runs")
                .select("*")
                .eq("id", run_id)
                .eq("status", "pending")
                .limit(1)
            )
        result = query.execute()
        if not result.data:
            return None
        row = result.data[0]
        self._client.table("sourcing_runs").update(
            {"status": "running"}
        ).eq("id", row["id"]).execute()
        return row

    def complete_run(
        self,
        run_id: str,
        *,
        status: str,
        product_profile: ProductProfile | dict | None = None,
        listings_found: int = 0,
        quotes_created: int = 0,
        error_message: str | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "status": status,
            "listings_found": listings_found,
            "quotes_created": quotes_created,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "error_message": error_message,
        }
        if product_profile is not None:
            payload["product_profile"] = (
                product_profile.to_dict()
                if isinstance(product_profile, ProductProfile)
                else product_profile
            )
        self._client.table("sourcing_runs").update(payload).eq("id", run_id).execute()

    def insert_sourced_listings(self, listings: list[dict[str, Any]]) -> int:
        if not listings:
            return 0
        result = self._client.table("sourced_listings").insert(listings).execute()
        return len(result.data or [])

    def insert_quote_options(self, request_id: str, quotes: list[QuoteTier]) -> int:
        if not quotes:
            return 0
        records = [
            {
                "request_id": request_id,
                "tier": q.tier,
                "product_name": q.product_name,
                "supplier_name": q.supplier_name,
                "supplier_url": q.supplier_url,
                "base_price": q.base_price,
                "retail_price": q.retail_price,
                "delivery_days": q.delivery_days,
                "quality_score": q.quality_score,
                "rating": q.rating,
                "image_url": q.image_url,
                "enhanced_image_url": q.enhanced_image_url,
                "metadata": q.metadata,
            }
            for q in quotes
        ]
        result = self._client.table("quote_options").insert(records).execute()
        return len(result.data or [])

    def list_pending_runs(self, limit: int = 10) -> list[dict[str, Any]]:
        result = (
            self._client.table("sourcing_runs")
            .select("id, request_id, query, started_at")
            .eq("status", "pending")
            .order("started_at")
            .limit(limit)
            .execute()
        )
        return result.data or []
