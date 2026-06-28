"""
Product Understanding — AI-powered intent parsing for customer requests.
Uses OpenAI when available, falls back to rule-based NLP.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from src.config import config

CATEGORY_HINTS: dict[str, list[str]] = {
    "sofa": ["sofa", "couch", "sectional", "loveseat"],
    "chair": ["chair", "armchair", "seat", "stool", "recliner"],
    "table": ["table", "desk", "dining", "coffee table"],
    "bed": ["bed", "mattress", "frame", "headboard"],
    "lamps": ["lamp", "light", "lighting", "chandelier"],
    "dressers": ["dresser", "drawer", "cabinet", "wardrobe"],
    "electronics": ["headphone", "speaker", "phone", "laptop", "tablet", "camera"],
}


@dataclass
class ParsedIntent:
    product_type: str
    keywords: list[str]
    attributes: list[str]
    budget_min: float | None = None
    budget_max: float | None = None
    urgency: str = "standard"
    raw_query: str = ""

    def to_dict(self) -> dict:
        return {
            "productType": self.product_type,
            "keywords": self.keywords,
            "attributes": self.attributes,
            "budgetRange": (
                {"min": self.budget_min, "max": self.budget_max}
                if self.budget_min is not None
                else None
            ),
            "urgency": self.urgency,
        }


def parse_intent_rule_based(query: str, budget: float | None = None) -> ParsedIntent:
    """Rule-based intent parser — always available, no API key required."""
    normalized = query.lower().strip()
    keywords = [
        w for w in re.split(r"\s+", normalized)
        if len(w) > 2 and w not in {"the", "and", "for", "with", "under", "over"}
    ][:10]

    product_type = "general"
    for category, hints in CATEGORY_HINTS.items():
        if any(hint in normalized for hint in hints):
            product_type = category
            break

    attributes: list[str] = []
    if any(w in normalized for w in ["cheap", "budget", "affordable", "under"]):
        attributes.append("budget-conscious")
    if any(w in normalized for w in ["fast", "urgent", "quick", "asap", "rush"]):
        attributes.append("fast-delivery")
    if any(w in normalized for w in ["quality", "premium", "luxury", "best"]):
        attributes.append("high-quality")
    if any(w in normalized for w in ["minimal", "modern", "scandinavian", "sleek"]):
        attributes.append("minimalist")

    budget_min = budget * 0.7 if budget else None
    budget_max = budget * 1.2 if budget else None

    price_match = re.search(r"under\s+\$?(\d+)", normalized)
    if price_match and not budget:
        budget_max = float(price_match.group(1))
        budget_min = budget_max * 0.5

    urgency = "express" if "fast-delivery" in attributes else "standard"

    return ParsedIntent(
        product_type=product_type,
        keywords=keywords,
        attributes=attributes,
        budget_min=budget_min,
        budget_max=budget_max,
        urgency=urgency,
        raw_query=query,
    )


def parse_intent_ai(query: str, budget: float | None = None) -> ParsedIntent:
    """AI-enhanced intent parsing via OpenAI. Falls back to rule-based."""
    if not config.openai_api_key:
        return parse_intent_rule_based(query, budget)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=config.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a product sourcing AI. Parse the customer query into JSON with: "
                        "product_type (category string), keywords (array), attributes (array), "
                        "budget_min (number or null), budget_max (number or null), urgency (standard|express|flexible)."
                    ),
                },
                {"role": "user", "content": query},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        data = json.loads(response.choices[0].message.content or "{}")
        return ParsedIntent(
            product_type=data.get("product_type", "general"),
            keywords=data.get("keywords", []),
            attributes=data.get("attributes", []),
            budget_min=data.get("budget_min") or (budget * 0.7 if budget else None),
            budget_max=data.get("budget_max") or (budget * 1.2 if budget else None),
            urgency=data.get("urgency", "standard"),
            raw_query=query,
        )
    except Exception:
        return parse_intent_rule_based(query, budget)
