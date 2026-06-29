"""
Almost Anything — Configuration
Centralized settings for the Python sourcing engine.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[2]
_PYTHON_DIR = Path(__file__).resolve().parents[1]

# Load Next.js env first, then python-local overrides
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT / ".env")
load_dotenv(_PYTHON_DIR / ".env")


@dataclass(frozen=True)
class Config:
    """Application configuration loaded from environment variables."""

    # Supabase
    supabase_url: str = field(
        default_factory=lambda: os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    )
    supabase_service_key: str = field(
        default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    )

    # Internal API (Next.js ingest endpoint)
    api_base_url: str = field(
        default_factory=lambda: os.getenv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    )
    internal_api_key: str = field(
        default_factory=lambda: os.getenv("INTERNAL_API_KEY", "")
    )

    # AI providers
    openai_api_key: str = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    anthropic_api_key: str = field(
        default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", "")
    )
    llm_provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "auto")
    )
    openai_model: str = field(
        default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    )
    anthropic_model: str = field(
        default_factory=lambda: os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    )

    # Markup defaults
    default_markup_percent: float = 18.0
    min_markup_percent: float = 8.0
    max_markup_percent: float = 45.0

    # Sourcing
    max_suppliers_per_query: int = 10
    scrape_timeout_seconds: int = 30
    user_agent: str = (
        "AlmostAnythingBot/1.0 (+https://almostanything.store; product-sourcing)"
    )

    def validate(self) -> list[str]:
        """Return list of missing required configuration keys."""
        errors: list[str] = []
        if not self.supabase_url:
            errors.append("NEXT_PUBLIC_SUPABASE_URL is not set")
        if not self.internal_api_key:
            errors.append("INTERNAL_API_KEY is not set (required for ingest API)")
        return errors


config = Config()
