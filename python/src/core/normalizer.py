"""
Product profile normalizer — converts any customer input into ProductProfile.
Uses LLM when available, rule-based fallback otherwise.
"""

from __future__ import annotations

import re

from src.ai.product_understanding import parse_intent_ai, parse_intent_rule_based
from src.core.models import InputMethod, ProductProfile, VariantOption
from src.providers.llm_router import LLMRouter

COLOUR_WORDS = {
    "black", "white", "grey", "gray", "navy", "beige", "brown", "green",
    "blue", "red", "oak", "walnut", "cream", "charcoal",
}
SIZE_PATTERNS = [
    r"\b(s|m|l|xl|xxl)\b",
    r"\b(small|medium|large)\b",
    r"\b\d{2,3}\s?cm\b",
    r"\bking\b",
    r"\bqueen\b",
    r"\btwin\b",
]


def _extract_colours(text: str) -> list[str]:
    lower = text.lower()
    return sorted({w.title() for w in COLOUR_WORDS if w in lower})


def _extract_sizes(text: str) -> list[str]:
    lower = text.lower()
    found: set[str] = set()
    for pattern in SIZE_PATTERNS:
        for match in re.findall(pattern, lower):
            found.add(match.upper() if len(match) <= 3 else match.title())
    return sorted(found)


def normalize_profile(
    query: str,
    *,
    budget: float | None = None,
    urgency: str = "standard",
    input_method: InputMethod = "text",
) -> ProductProfile:
    """Build a normalized product profile from a customer query."""
    intent = parse_intent_ai(query, budget) if query else parse_intent_rule_based(query, budget)

    colours = _extract_colours(query)
    sizes = _extract_sizes(query)
    variants: list[VariantOption] = []

    for colour in colours:
        for size in sizes or [""]:
            label = f"{colour} {size}".strip()
            variants.append(
                VariantOption(
                    label=label,
                    attributes={"colour": colour, **({"size": size} if size else {})},
                )
            )

    profile = ProductProfile(
        raw_query=query,
        product_type=intent.product_type,
        title_hint=query.strip()[:120],
        keywords=intent.keywords,
        attributes=intent.attributes,
        colours=colours,
        sizes=sizes,
        variants=variants,
        budget_min=intent.budget_min,
        budget_max=intent.budget_max,
        urgency=urgency or intent.urgency,
        input_method=input_method,
        confidence=0.55,
    )

    if LLMRouter().is_available:
        enriched = _enrich_with_llm(query, profile)
        if enriched:
            return enriched

    return profile


def _enrich_with_llm(query: str, base: ProductProfile) -> ProductProfile | None:
    router = LLMRouter()
    data = router.complete_json(
        system=(
            "You normalize product sourcing requests into JSON. Return: "
            "product_type, title_hint, keywords (array), attributes (array), "
            "colours (array), sizes (array), materials (array), "
            "budget_min, budget_max, urgency, confidence (0-1)."
        ),
        user=query,
    )
    if not data:
        return None

    colours = data.get("colours") or base.colours
    sizes = data.get("sizes") or base.sizes
    variants = base.variants
    if colours and not variants:
        variants = [
            VariantOption(label=c, attributes={"colour": c}) for c in colours
        ]

    return base.model_copy(
        update={
            "product_type": data.get("product_type", base.product_type),
            "title_hint": data.get("title_hint", base.title_hint),
            "keywords": data.get("keywords", base.keywords),
            "attributes": data.get("attributes", base.attributes),
            "colours": colours,
            "sizes": sizes,
            "materials": data.get("materials", base.materials),
            "variants": variants,
            "budget_min": data.get("budget_min", base.budget_min),
            "budget_max": data.get("budget_max", base.budget_max),
            "urgency": data.get("urgency", base.urgency),
            "confidence": float(data.get("confidence", 0.75)),
        }
    )
