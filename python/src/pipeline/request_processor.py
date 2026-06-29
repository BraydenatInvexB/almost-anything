"""
Request processor — handles customer item requests end-to-end.

Triggered by:
  python main.py --request-id <id>
  python main.py --process-pending
"""

from __future__ import annotations

import logging
from typing import Any

from src.pipeline.orchestrator import SourcingOrchestrator
from src.repositories.supabase_repo import SupabaseRepository

logger = logging.getLogger(__name__)


async def process_customer_request(
    request_id: str,
    *,
    enhance_images: bool = True,
    ingest_catalog: bool = False,
) -> dict[str, Any]:
    """
    Process a single customer_requests row:
      searching → quote_options + sourced_listings → quoted
    """
    repo = SupabaseRepository()
    request = repo.get_customer_request(request_id)
    if not request:
        raise ValueError(f"Customer request not found: {request_id}")

    query = request["query"]
    repo.update_request_status(request_id, "searching")

    orchestrator = SourcingOrchestrator(enhance_images=enhance_images)
    result = await orchestrator.run(
        query,
        budget=_parse_budget(request),
        urgency=_parse_urgency(request),
        input_method="request",
        persist=ingest_catalog,
    )

    repo.update_request_status(
        request_id,
        "quoted",
        parsed_intent=result.profile.to_dict(),
    )

    sourced_records = [
        {
            "supplier_name": l.get("supplier_name", "Unknown"),
            "supplier_url": l.get("supplier_url", ""),
            "raw_price": l.get("base_price", 0),
            "availability": l.get("availability", "in_stock"),
            "delivery_estimate": f"{l.get('delivery_days', 7)} days",
            "rating": l.get("rating"),
            "review_count": l.get("review_count"),
            "metadata": {"request_id": request_id, "category": l.get("category")},
        }
        for l in result.listings
    ]
    listings_saved = repo.insert_sourced_listings(sourced_records)
    quotes_saved = repo.insert_quote_options(request_id, result.quotes)

    return {
        "request_id": request_id,
        "status": "quoted",
        "profile": result.profile.to_dict(),
        "listings_found": len(result.listings),
        "listings_saved": listings_saved,
        "quotes_saved": quotes_saved,
        "ingest": result.ingest,
    }


async def process_pending_run(
    run_id: str | None = None,
    *,
    enhance_images: bool = True,
) -> dict[str, Any]:
    """Claim a pending sourcing_runs row and process its linked request."""
    repo = SupabaseRepository()
    run = repo.claim_pending_run(run_id)
    if not run:
        return {"processed": False, "reason": "no_pending_runs"}

    request_id = run.get("request_id")
    if not request_id:
        repo.complete_run(
            run["id"],
            status="failed",
            error_message="Missing request_id on sourcing run",
        )
        return {"processed": False, "run_id": run["id"], "reason": "missing_request_id"}

    try:
        outcome = await process_customer_request(
            request_id,
            enhance_images=enhance_images,
            ingest_catalog=False,
        )
        repo.complete_run(
            run["id"],
            status="completed",
            product_profile=outcome.get("profile"),  # type: ignore[arg-type]
            listings_found=outcome.get("listings_found", 0),
            quotes_created=outcome.get("quotes_saved", 0),
        )
        return {"processed": True, "run_id": run["id"], **outcome}
    except Exception as exc:
        logger.exception("Sourcing run failed: %s", exc)
        repo.complete_run(run["id"], status="failed", error_message=str(exc))
        repo.update_request_status(request_id, "failed")
        return {"processed": False, "run_id": run["id"], "error": str(exc)}


def _parse_budget(request: dict[str, Any]) -> float | None:
    metadata = request.get("metadata") or {}
    budget = metadata.get("budget") or request.get("budget")
    if budget is None:
        return None
    try:
        return float(budget)
    except (TypeError, ValueError):
        return None


def _parse_urgency(request: dict[str, Any]) -> str:
    metadata = request.get("metadata") or {}
    return str(metadata.get("urgency") or request.get("urgency") or "standard")
