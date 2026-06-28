# Almost Anything

**An AI-powered sourcing store where you can buy almost anything.**

Almost Anything uses machine learning, Python automation, and Supabase to discover products from suppliers worldwide, compare price/stock/delivery/reviews, apply smart markup, and present them in a beautiful bento-grid storefront.

## Architecture

```
Customer Request
       ↓
AI understands intent (product understanding)
       ↓
Python scripts search suppliers / websites / APIs
       ↓
System compares price, stock, delivery, reviews
       ↓
Markup engine adds profit margin
       ↓
AI enhances product photos
       ↓
Products appear in storefront (Supabase)
       ↓
Customer pays → You source → Ship to customer
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| APIs | Next.js Route Handlers with rate limiting & audit logging |
| Sourcing | Python (httpx, BeautifulSoup, OpenAI, Pillow) |
| AI | Intent parsing, quote generation, image enhancement |

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor or Supabase CLI
3. Copy your project URL, anon key, and service role key to `.env.local`

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Set up Python sourcing engine

```bash
cd python
pip install -r requirements.txt
cp ../.env.example ../.env
# Fill in credentials

# Run full catalog sync
python main.py

# Source specific product
python main.py --query "minimal curved sofa under $600"

# Continuous supplier monitoring
python main.py --watch --interval 60
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── products/       # Public product catalog API
│   │   ├── quotes/         # AI quote generator
│   │   ├── newsletter/     # Newsletter signup
│   │   └── internal/       # Secured ingest (Python → store)
│   ├── quote/              # Quote generator page
│   └── products/           # Product detail pages
├── components/
│   ├── home/               # Bento grid components (Nestify design)
│   ├── layout/             # Header, footer
│   └── ui/                 # Reusable UI primitives
├── lib/
│   ├── ai/                 # Quote generator logic
│   ├── markup/             # Dynamic pricing engine
│   ├── security/           # Rate limiting, validation, audit
│   └── supabase/           # Client, server, admin clients
├── services/               # Business logic layer
└── types/                  # TypeScript types & Supabase schema

python/
├── src/
│   ├── ai/                 # Intent parsing, image enhancement
│   ├── scrapers/           # Multi-supplier discovery
│   └── services/           # Markup, ingest client
└── main.py                 # Pipeline orchestrator

supabase/
└── migrations/             # Database schema + RLS policies
```

## Features

### Storefront
- **Bento Grid Homepage** — Nestify-inspired design with live catalog data
- **Product Catalog** — Search, category filters, pagination at `/products`
- **Product Detail** — Add to cart, favorites, delivery info, AI sourcing badge
- **Shopping Cart** — Persistent cart (localStorage), quantity controls
- **Checkout** — Full shipping form, order summary, demo payment (Stripe optional)
- **Order Confirmation** — Success page with fulfillment timeline

### AI Sourcing
- **Quote Generator** (`/quote`) — 3 options: cheapest, fastest, best quality
- **Custom Sourcing Request** (`/request`) — Submit anything to the AI pipeline
- **Quote → Cart** — Select a quote option and checkout immediately
- **Python Pipeline** — Supplier search, image enhancement, ingest to store

### User Features
- **Favorites** — Save products with heart icon, persisted locally
- **Auth** — Sign up / sign in via Supabase (optional)
- **Account Dashboard** — Orders, favorites, cart, sourcing requests
- **Order History** — View past orders when signed in + Supabase configured

### Backend
- **Supabase** — Products, quotes, orders, newsletter, audit log
- **Secure APIs** — Rate limiting, Zod validation, internal API key auth
- **Markup Engine** — Dynamic pricing by category, rating, urgency

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/products` | Public | List products with search/filter |
| POST | `/api/quotes` | Public | Generate AI quote options |
| GET | `/api/quotes?requestId=` | Public | Retrieve saved quote |
| POST | `/api/newsletter` | Public | Subscribe to newsletter |
| POST | `/api/checkout` | Public | Place order (demo or Stripe) |
| GET | `/api/orders` | Auth | List user orders |
| GET | `/api/orders?orderNumber=` | Public | Get order by number |
| POST | `/api/sourcing` | Public | Submit custom sourcing request |
| POST | `/api/internal/ingest` | API Key | Ingest sourced products (Python) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Bento grid homepage |
| `/products` | Full catalog with search & filters |
| `/products/[slug]` | Product detail + add to cart |
| `/cart` | Shopping cart |
| `/checkout` | Shipping + payment |
| `/checkout/success` | Order confirmation |
| `/quote` | AI quote generator |
| `/request` | Custom sourcing request |
| `/favorites` | Saved products |
| `/login` / `/signup` | Authentication |
| `/account` | User dashboard |
| `/account/orders` | Order history |

## Environment Variables

See `.env.example` for all required variables.

## License

Private — Almost Anything © 2026
