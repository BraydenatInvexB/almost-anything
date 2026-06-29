"""
Copy humanization — strip AI-generated patterns from product text.

Storefront copy should read naturally: no em dashes, no filler phrases,
no robotic listicles.
"""

from __future__ import annotations

import re

FILLER_PHRASES = [
    r"\bperfect for\b",
    r"\belevate your\b",
    r"\bseamlessly\b",
    r"\bcrafted with care\b",
    r"\bdiscover the\b",
    r"\bexperience the\b",
    r"\bunparalleled\b",
    r"\bstate-of-the-art\b",
]

REPLACEMENTS: list[tuple[str, str]] = [
    (r"\s*—\s*", ", "),
    (r"\s*--\s*", ", "),
    (r"\s+-\s+", ", "),
    (r"\s{2,}", " "),
    (r",\s*,", ","),
]


def humanize_copy(text: str) -> str:
    """Return storefront-ready copy from raw supplier or AI-generated text."""
    if not text or not text.strip():
        return ""

    result = text.strip()

    for pattern, replacement in REPLACEMENTS:
        result = re.sub(pattern, replacement, result)

    for phrase in FILLER_PHRASES:
        result = re.sub(phrase, "", result, flags=re.IGNORECASE)

    result = re.sub(r"\s+([,.])", r"\1", result)
    result = result.strip(" ,.")

    if result and result[-1] not in ".!?":
        result += "."

    return result[0].upper() + result[1:] if result else ""


def humanize_product_fields(listing: dict) -> dict:
    """Apply humanize_copy to name and description fields in-place."""
    listing = dict(listing)
    if name := listing.get("name"):
        listing["name"] = humanize_copy(str(name)).rstrip(".")
    if desc := listing.get("description"):
        listing["description"] = humanize_copy(str(desc))
    return listing
