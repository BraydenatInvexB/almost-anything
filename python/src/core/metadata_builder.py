"""Build product metadata JSON matching the Next.js storefront schema."""

from __future__ import annotations

from typing import Any

from src.core.models import ProductProfile


def build_variants_config(profile: ProductProfile) -> dict[str, Any]:
    options: list[dict[str, Any]] = []
    if profile.colours:
        options.append({"name": "Colour", "values": profile.colours})
    if profile.sizes:
        options.append({"name": "Size", "values": profile.sizes})

    if profile.variants and not options:
        colour_vals = sorted({v.attributes.get("colour") for v in profile.variants if v.attributes.get("colour")})
        size_vals = sorted({v.attributes.get("size") for v in profile.variants if v.attributes.get("size")})
        if colour_vals:
            options.append({"name": "Colour", "values": colour_vals})
        if size_vals:
            options.append({"name": "Size", "values": size_vals})

    variants: list[dict[str, Any]] = []
    if options:

        def combine(idx: int, current: dict[str, str]) -> None:
            if idx >= len(options):
                vid = "-".join(current.values()).lower().replace(" ", "-")
                variants.append(
                    {
                        "id": vid,
                        "selections": dict(current),
                        "stock": 10,
                        "priceAdjust": 0,
                    }
                )
                return
            opt = options[idx]
            for value in opt["values"]:
                combine(idx + 1, {**current, opt["name"]: value})

        combine(0, {})

    return {"options": options, "variants": variants}


def build_product_metadata(
    profile: ProductProfile,
    *,
    highlights: list[str] | None = None,
    specifications: dict[str, str] | None = None,
    summary: str | None = None,
    query: str | None = None,
    supplier_name: str | None = None,
) -> dict[str, Any]:
    meta: dict[str, Any] = {}
    variant_cfg = build_variants_config(profile)
    if variant_cfg["options"]:
        meta["variants"] = variant_cfg
    if highlights:
        meta["highlights"] = highlights
    if specifications:
        meta["specifications"] = specifications
    if summary:
        meta["summary"] = summary
    if query:
        from datetime import datetime, timezone

        meta["sourcing"] = {
            "query": query,
            "discoveredAt": datetime.now(timezone.utc).isoformat(),
            "supplierName": supplier_name,
        }
    return meta
