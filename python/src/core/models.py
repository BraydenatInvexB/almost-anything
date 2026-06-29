"""Core domain models for the sourcing pipeline."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

InputMethod = Literal["text", "voice", "image", "request"]


class VariantOption(BaseModel):
    """A single purchasable variant (colour, size, material, etc.)."""

    label: str
    sku_hint: str | None = None
    attributes: dict[str, str] = Field(default_factory=dict)
    price_delta: float = 0.0


class ProductProfile(BaseModel):
    """
    Normalized product profile — the canonical shape every input method
    (search, voice, image, item request) is converted into before sourcing.
    """

    raw_query: str
    product_type: str = "general"
    title_hint: str = ""
    keywords: list[str] = Field(default_factory=list)
    attributes: list[str] = Field(default_factory=list)
    colours: list[str] = Field(default_factory=list)
    sizes: list[str] = Field(default_factory=list)
    materials: list[str] = Field(default_factory=list)
    variants: list[VariantOption] = Field(default_factory=list)
    budget_min: float | None = None
    budget_max: float | None = None
    urgency: str = "standard"
    input_method: InputMethod = "text"
    confidence: float = 0.5

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump()


class QuoteTier(BaseModel):
    tier: Literal["cheapest", "fastest", "best_quality"]
    product_name: str
    supplier_name: str
    supplier_url: str | None = None
    base_price: float
    retail_price: float
    delivery_days: int
    quality_score: int
    rating: float | None = None
    image_url: str | None = None
    enhanced_image_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
