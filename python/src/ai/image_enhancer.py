"""
Image Enhancement — AI-powered product photo improvement.
Enhances scraped images for catalog display using OpenAI DALL-E or local Pillow processing.
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Any

import httpx
from PIL import Image, ImageEnhance, ImageFilter

from src.config import config


@dataclass
class EnhancedImage:
    original_url: str
    enhanced_url: str
    method: str
    metadata: dict[str, Any]


class ImageEnhancer:
    """Enhance product images for storefront display."""

    def __init__(self) -> None:
        self.timeout = config.scrape_timeout_seconds

    async def download_image(self, url: str) -> bytes | None:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=self.timeout)
                if response.status_code == 200:
                    return response.content
        except Exception:
            pass
        return None

    def enhance_local(self, image_bytes: bytes) -> bytes:
        """
        Local enhancement pipeline:
        - Sharpen details
        - Boost contrast and color
        - Subtle vignette for premium look
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        img = ImageEnhance.Sharpness(img).enhance(1.3)
        img = ImageEnhance.Contrast(img).enhance(1.1)
        img = ImageEnhance.Color(img).enhance(1.08)
        img = ImageEnhance.Brightness(img).enhance(1.03)

        img = img.filter(ImageFilter.SMOOTH_MORE)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=92, optimize=True)
        return buffer.getvalue()

    async def enhance_with_ai(self, image_url: str, product_name: str) -> EnhancedImage:
        """
        AI enhancement via OpenAI image editing.
        Falls back to local Pillow enhancement if no API key.
        """
        if config.openai_api_key:
            try:
                enhanced = await self._openai_enhance(image_url, product_name)
                if enhanced:
                    return enhanced
            except Exception:
                pass

        image_bytes = await self.download_image(image_url)
        if image_bytes:
            enhanced_bytes = self.enhance_local(image_bytes)
            return EnhancedImage(
                original_url=image_url,
                enhanced_url=image_url,
                method="local_pillow",
                metadata={
                    "size_bytes": len(enhanced_bytes),
                    "product_name": product_name,
                    "note": "Local enhancement applied; upload to Supabase Storage for persistence",
                },
            )

        return EnhancedImage(
            original_url=image_url,
            enhanced_url=image_url,
            method="passthrough",
            metadata={"product_name": product_name},
        )

    async def _openai_enhance(
        self, image_url: str, product_name: str
    ) -> EnhancedImage | None:
        """Use OpenAI to generate an enhanced product photo."""
        from openai import OpenAI

        client = OpenAI(api_key=config.openai_api_key)

        image_bytes = await self.download_image(image_url)
        if not image_bytes:
            return None

        response = client.images.edit(
            model="dall-e-2",
            image=io.BytesIO(image_bytes),
            prompt=(
                f"Professional e-commerce product photo of {product_name}. "
                "Clean white/neutral background, studio lighting, high-end catalog quality, "
                "sharp details, no text or watermarks."
            ),
            n=1,
            size="1024x1024",
        )

        enhanced_url = response.data[0].url if response.data else image_url

        return EnhancedImage(
            original_url=image_url,
            enhanced_url=enhanced_url or image_url,
            method="openai_dalle",
            metadata={"product_name": product_name},
        )

    async def batch_enhance(
        self, products: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Enhance images for a batch of products."""
        enhanced_products = []
        for product in products:
            image_url = product.get("image_url", "")
            if not image_url:
                enhanced_products.append(product)
                continue

            result = await self.enhance_with_ai(image_url, product.get("name", ""))
            product["enhanced_image_url"] = result.enhanced_url
            product["enhancement_metadata"] = result.metadata
            enhanced_products.append(product)

        return enhanced_products
