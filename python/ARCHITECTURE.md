# Sourcing Engine Architecture

The Python pipeline is the intelligence layer behind international warehouse sourcing.
It normalizes every customer input into a **ProductProfile**, discovers supplier options,
polishes copy and images, applies commercial rules, and persists results to Supabase.

## Package layout

```
python/
  main.py                     CLI entrypoint
  src/
    core/                     Domain models, copy humanization, profile normalizer
    providers/                OpenAI + Anthropic LLM router
    pipeline/                 Orchestrator + item-request processor
    repositories/             Supabase read/write
    scrapers/                 Supplier discovery adapters
    ai/                       Image enhancement (legacy path, used by orchestrator)
    services/                 Markup engine, ingest client
```

## Data flow

1. **Storefront search** → Next.js logs `search_events` → Admin **Searches** module
2. **Item request** → `customer_requests` + `sourcing_runs` (pending)
3. **Worker** → `python main.py --process-pending` or `--request-id <id>`
4. **Pipeline** → `quote_options` + `sourced_listings` → request status `quoted`

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Pipeline writes |
| `INTERNAL_API_KEY` | Catalog ingest via Next.js API |
| `OPENAI_API_KEY` | Intent, copy, images |
| `ANTHROPIC_API_KEY` | Product intelligence (variants, specs, copy) |
| `LLM_PROVIDER` | `openai`, `anthropic`, or `auto` (default: `auto` — Anthropic first, OpenAI fallback) |

## Commands

```bash
cd python && pip install -r requirements.txt

# Catalog sync (demo suppliers → products table)
python main.py

# Process queued item request
python main.py --process-pending

# Process specific request
python main.py --request-id REQ-20250629-ABC123
```

## Design principles

- **One stage at a time** — each pipeline step is isolated and logged
- **Provider agnostic** — LLM router tries preferred provider, falls back gracefully
- **Human storefront copy** — `core/copy.py` strips em dashes and AI filler phrases
- **Frontend parity** — same Supabase tables the Next.js admin reads
