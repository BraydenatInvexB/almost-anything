"""LLM provider router — OpenAI and Anthropic with graceful fallback."""

from __future__ import annotations

import json
import logging
from typing import Any

from src.config import config

logger = logging.getLogger(__name__)


class LLMRouter:
    """Route structured completions to the best available provider."""

    def __init__(self) -> None:
        self._openai_key = config.openai_api_key
        self._anthropic_key = config.anthropic_api_key
        self.preferred = config.llm_provider

    @property
    def is_available(self) -> bool:
        return bool(self._openai_key or self._anthropic_key)

    def complete_json(self, system: str, user: str) -> dict[str, Any]:
        providers = self._provider_order()
        for name in providers:
            try:
                if name == "anthropic":
                    result = self._anthropic_json(system, user)
                else:
                    result = self._openai_json(system, user)
                if result:
                    return result
            except Exception as exc:
                logger.warning("LLM provider %s failed: %s", name, exc)
        return {}

    def complete_text(self, system: str, user: str, *, temperature: float = 0.4) -> str:
        providers = self._provider_order()
        for name in providers:
            try:
                if name == "anthropic":
                    return self._anthropic_text(system, user, temperature)
                return self._openai_text(system, user, temperature)
            except Exception as exc:
                logger.warning("LLM provider %s failed: %s", name, exc)
        return ""

    def _provider_order(self) -> list[str]:
        if self.preferred == "anthropic" and self._anthropic_key:
            return ["anthropic", "openai"]
        if self.preferred == "openai" and self._openai_key:
            return ["openai", "anthropic"]
        if self.preferred == "auto":
            order: list[str] = []
            if self._anthropic_key:
                order.append("anthropic")
            if self._openai_key:
                order.append("openai")
            return order or []
        order: list[str] = []
        if self._openai_key:
            order.append("openai")
        if self._anthropic_key:
            order.append("anthropic")
        return order

    def _openai_json(self, system: str, user: str) -> dict[str, Any]:
        if not self._openai_key:
            return {}
        from openai import OpenAI

        client = OpenAI(api_key=self._openai_key)
        response = client.chat.completions.create(
            model=config.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        return json.loads(response.choices[0].message.content or "{}")

    def _openai_text(self, system: str, user: str, temperature: float) -> str:
        if not self._openai_key:
            return ""
        from openai import OpenAI

        client = OpenAI(api_key=self._openai_key)
        response = client.chat.completions.create(
            model=config.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
        )
        return (response.choices[0].message.content or "").strip()

    def _anthropic_json(self, system: str, user: str) -> dict[str, Any]:
        if not self._anthropic_key:
            return {}
        import anthropic

        client = anthropic.Anthropic(api_key=self._anthropic_key)
        response = client.messages.create(
            model=config.anthropic_model,
            max_tokens=1024,
            system=system + " Respond with valid JSON only.",
            messages=[{"role": "user", "content": user}],
        )
        text = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return json.loads(text or "{}")

    def _anthropic_text(self, system: str, user: str, temperature: float) -> str:
        if not self._anthropic_key:
            return ""
        import anthropic

        client = anthropic.Anthropic(api_key=self._anthropic_key)
        response = client.messages.create(
            model=config.anthropic_model,
            max_tokens=1024,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return "".join(
            block.text for block in response.content if block.type == "text"
        ).strip()
