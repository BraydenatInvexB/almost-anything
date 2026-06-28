"""
Markup Engine — Python mirror of the TypeScript markup logic.
Applies dynamic profit margins based on category, supplier rating, and demand.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from src.config import config

Urgency = Literal["standard", "express", "flexible"]

CATEGORY_MARKUP: dict[str, float] = {
    "electronics": 12.0,
    "sofa": 15.0,
    "chair": 14.0,
    "bed": 16.0,
    "table": 13.0,
    "dressers": 14.0,
    "lamps": 18.0,
    "general": config.default_markup_percent,
}

URGENCY_MULTIPLIERS: dict[str, float] = {
    "standard": 1.0,
    "express": 1.08,
    "flexible": 0.95,
}


@dataclass
class MarkupInput:
    base_price: float
    category: str = "general"
    supplier_rating: float = 4.0
    demand_score: float = 0.5
    is_exclusive: bool = False
    urgency: Urgency = "standard"


@dataclass
class MarkupResult:
    base_price: float
    markup_percent: float
    markup_amount: float
    retail_price: float
    profit: float
    currency: str = "USD"


def calculate_markup(inp: MarkupInput) -> MarkupResult:
    """Calculate retail price with dynamic markup rules."""
    markup_percent = CATEGORY_MARKUP.get(inp.category, config.default_markup_percent)

    if inp.supplier_rating >= 4.8:
        markup_percent += 2.0
    elif inp.supplier_rating < 3.5:
        markup_percent -= 1.0

    if inp.demand_score > 0.75:
        markup_percent += 3.0
    elif inp.demand_score < 0.25:
        markup_percent -= 2.0

    if inp.is_exclusive:
        markup_percent += 5.0

    markup_percent *= URGENCY_MULTIPLIERS.get(inp.urgency, 1.0)
    markup_percent = max(
        config.min_markup_percent,
        min(config.max_markup_percent, markup_percent),
    )

    markup_amount = round(inp.base_price * (markup_percent / 100), 2)
    retail_price = round(inp.base_price + markup_amount, 2)

    return MarkupResult(
        base_price=inp.base_price,
        markup_percent=round(markup_percent, 1),
        markup_amount=markup_amount,
        retail_price=retail_price,
        profit=markup_amount,
    )


def apply_bulk_markup(items: list[MarkupInput]) -> list[MarkupResult]:
    return [calculate_markup(item) for item in items]
