import type { Product, ProductCardData } from "@/types";
import type { ProductCategory } from "@/types/database";

type StockStatus = Product["stock_status"];

interface SeedInput {
  slug: string;
  name: string;
  category: ProductCategory;
  base: number;
  desc: string;
  /** Unsplash photo path, e.g. "photo-1555041469-a586c61ea9bc". */
  img: string;
  rating?: number;
  reviews?: number;
  markup?: number;
  stock?: StockStatus;
  supplier?: string;
  featured?: boolean;
  exclusive?: boolean;
  /** Deal discount percent (also flags the item as a deal). */
  deal?: number;
  dmin?: number;
  dmax?: number;
  badge?: string;
}

type SeedProduct = Omit<Product, "id" | "created_at" | "updated_at">;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Catalog source prices are authored in a base unit; this rate converts them
 * into South African Rand so the storefront shows realistic local pricing.
 */
const ZAR_RATE = 18;

function img(path: string, w = 800, h = 800) {
  return `https://images.unsplash.com/${path}?w=${w}&h=${h}&fit=crop`;
}

function product(p: SeedInput): SeedProduct {
  const markup = p.markup ?? 18;
  const base = round2(p.base * ZAR_RATE);
  const retail = round2(base * (1 + markup / 100));
  const imageUrl = img(p.img);
  return {
    slug: p.slug,
    name: p.name,
    description: p.desc,
    category: p.category,
    base_price: base,
    retail_price: retail,
    markup_percent: markup,
    currency: "ZAR",
    rating: p.rating ?? 4.6,
    review_count: p.reviews ?? Math.floor(40 + Math.random() * 260),
    stock_status: p.stock ?? "in_stock",
    image_url: imageUrl,
    enhanced_image_url: `${imageUrl}&q=90`,
    source_url: `https://example.com/catalog/${p.slug}`,
    source_name: p.supplier ?? "Almost Anything",
    delivery_days_min: p.dmin ?? 2,
    delivery_days_max: p.dmax ?? 7,
    is_featured: p.featured ?? false,
    is_exclusive: p.exclusive ?? false,
    is_deal: p.deal !== undefined,
    deal_discount_percent: p.deal ?? null,
    metadata: p.badge ? { badge: p.badge } : {},
  };
}

export const SEED_PRODUCTS: SeedProduct[] = [
  // ───────────────────────── Electronics ─────────────────────────
  product({ slug: "pulse-smartwatch-x", name: "Pulse Smartwatch Series X", category: "electronics", base: 180, rating: 4.8, reviews: 642, featured: true, deal: 20, badge: "Best Seller", img: "photo-1523275335684-37898b6baf30", desc: "Track fitness, heart rate, sleep, and notifications with a vivid always-on display and 7-day battery." }),
  product({ slug: "voyager-4k-action-cam", name: "Voyager 4K Action Camera", category: "electronics", base: 220, rating: 4.7, reviews: 318, img: "photo-1526170375885-4d8ecf77b99f", desc: "Waterproof 4K60 action camera with stabilization, wide lens, and dual screens for vlogging and adventure." }),
  product({ slug: "skyview-pro-drone", name: "SkyView Pro Drone", category: "electronics", base: 480, rating: 4.6, reviews: 142, featured: true, stock: "low_stock", img: "photo-1473968512647-3e447244af8f", desc: "Foldable camera drone with 4K gimbal, 34-min flight time, and intelligent return-to-home." }),
  product({ slug: "paperglow-ereader", name: "PaperGlow E-Reader", category: "electronics", base: 110, rating: 4.7, reviews: 489, deal: 15, img: "photo-1544716278-ca5e3f4abd8c", desc: "Glare-free 7-inch e-ink reader with warm backlight, weeks of battery, and thousands of books on tap." }),
  product({ slug: "aura-smart-bulb-4pk", name: "Aura Smart Bulb (4-Pack)", category: "electronics", base: 45, rating: 4.5, reviews: 233, img: "photo-1565814329452-e1efa11c5b89", desc: "Color-changing Wi-Fi smart bulbs with app and voice control, schedules, and 16 million colors." }),

  // ───────────────────────── Computers ─────────────────────────
  product({ slug: "aerobook-14-ultrabook", name: "AeroBook 14 Ultrabook", category: "computers", base: 760, rating: 4.8, reviews: 211, featured: true, exclusive: true, badge: "EXCLUSIVE", img: "photo-1496181133206-80ce9b88a853", desc: "Featherlight 14-inch laptop with all-day battery, crisp 2.2K display, and powerful efficiency cores." }),
  product({ slug: "tactilex-mech-keyboard", name: "TactileX Mechanical Keyboard", category: "computers", base: 95, rating: 4.7, reviews: 540, deal: 25, badge: "Hot Deal", img: "photo-1587829741301-dc798b83add3", desc: "Hot-swappable mechanical keyboard with PBT keycaps, RGB, and a satisfying tactile typing feel." }),
  product({ slug: "vistawide-34-monitor", name: 'VistaWide 34" Curved Monitor', category: "computers", base: 380, rating: 4.6, reviews: 187, img: "photo-1527443224154-c4a3942d3acf", desc: "Immersive 34-inch ultrawide with 144Hz, HDR, and a curve that wraps your workspace." }),
  product({ slug: "glide-wireless-mouse", name: "Glide Wireless Mouse", category: "computers", base: 35, rating: 4.6, reviews: 612, img: "photo-1527864550417-7fd91fc51a46", desc: "Ergonomic silent-click wireless mouse with precision tracking and months of battery." }),
  product({ slug: "porthub-usb-c-hub", name: "PortHub 8-in-1 USB-C Hub", category: "computers", base: 45, rating: 4.5, reviews: 298, img: "photo-1625842268584-8f3296236761", desc: "Expand your laptop with HDMI 4K, USB 3.0, SD, and 100W passthrough charging in one sleek hub." }),

  // ───────────────────────── Phones & Tablets ─────────────────────────
  product({ slug: "zenith-x-smartphone", name: "Zenith X Smartphone", category: "phones", base: 720, rating: 4.8, reviews: 904, featured: true, badge: "New", img: "photo-1511707171634-5f897ff02aa9", desc: "Flagship phone with a 120Hz OLED display, pro-grade triple camera, and blazing fast performance." }),
  product({ slug: "slate-pro-11-tablet", name: "Slate Pro 11 Tablet", category: "phones", base: 430, rating: 4.7, reviews: 276, deal: 18, img: "photo-1544244015-0df4b3ffc6b0", desc: "11-inch tablet with laminated display, stylus support, and all-day battery for work and play." }),
  product({ slug: "heritage-leather-case", name: "Heritage Leather Phone Case", category: "phones", base: 22, rating: 4.6, reviews: 412, img: "photo-1601784551446-20c9e07cdbdb", desc: "Full-grain leather case that ages beautifully, with raised edges and precise cutouts." }),
  product({ slug: "boltcharge-65w", name: "BoltCharge 65W GaN Charger", category: "phones", base: 30, rating: 4.7, reviews: 521, img: "photo-1588872657578-7efd1f1555ed", desc: "Compact GaN charger powers phone, tablet, and laptop with three ports and fast charging." }),

  // ───────────────────────── Audio ─────────────────────────
  product({ slug: "silentpro-anc-headphones", name: "SilentPro ANC Headphones", category: "audio", base: 190, rating: 4.8, reviews: 1287, featured: true, deal: 30, badge: "Top Rated", img: "photo-1505740420928-5e560c06d30e", desc: "Industry-leading noise cancellation, plush comfort, and 30-hour battery for total immersion." }),
  product({ slug: "airbeat-wireless-earbuds", name: "AirBeat Wireless Earbuds", category: "audio", base: 95, rating: 4.6, reviews: 853, img: "photo-1590658268037-6bf12165a8df", desc: "True-wireless earbuds with rich bass, ANC, and a pocketable charging case." }),
  product({ slug: "boombox-mini-speaker", name: "BoomBox Mini Speaker", category: "audio", base: 60, rating: 4.5, reviews: 367, deal: 15, img: "photo-1608043152269-423dbba4e7e1", desc: "Pocket-sized waterproof speaker with surprising punch and 12 hours of playtime." }),
  product({ slug: "revolve-vinyl-turntable", name: "Revolve Vinyl Turntable", category: "audio", base: 160, rating: 4.7, reviews: 142, exclusive: true, badge: "EXCLUSIVE", img: "photo-1461360228754-6e81c478b882", desc: "Belt-driven turntable with built-in preamp and Bluetooth, ready to spin straight out of the box." }),

  // ───────────────────────── Home & Living ─────────────────────────
  product({ slug: "arc-floor-lamp", name: "Arc Floor Lamp", category: "home", base: 145, rating: 4.6, reviews: 44, stock: "low_stock", dmin: 2, dmax: 5, supplier: "Lumen Wholesale", img: "photo-1513506003901-1e6a229e2d15", desc: "Statement arc lamp in matte black with an adjustable shade for the perfect reading nook." }),
  product({ slug: "aura-candle-set", name: "Aura Scented Candle Set", category: "home", base: 28, rating: 4.7, reviews: 389, deal: 20, img: "photo-1603006905003-be475563bc59", desc: "Hand-poured soy candle trio with calming notes of sandalwood, vanilla, and sea salt." }),
  product({ slug: "abstract-canvas-art", name: "Abstract Canvas Wall Art", category: "home", base: 70, rating: 4.5, reviews: 156, img: "photo-1541961017774-22349e4a1262", desc: "Gallery-wrapped abstract canvas that adds warmth and color to any wall." }),
  product({ slug: "cloud-knit-throw", name: "Cloud Knit Throw Blanket", category: "home", base: 40, rating: 4.8, reviews: 472, img: "photo-1580301762395-21ce84d00bc6", desc: "Ultra-soft chunky knit throw that drapes beautifully over sofas and beds." }),
  product({ slug: "minimal-ceramic-vase", name: "Minimal Ceramic Vase", category: "home", base: 25, rating: 4.6, reviews: 201, img: "photo-1578500494198-246f612d3b3d", desc: "Matte stoneware vase with organic curves, stunning with or without flowers." }),

  // ───────────────────────── Kitchen ─────────────────────────
  product({ slug: "crema-espresso-machine", name: "Crema Espresso Machine", category: "kitchen", base: 240, rating: 4.7, reviews: 318, featured: true, deal: 22, badge: "Hot Deal", img: "photo-1517668808822-9ebb02f2a0e6", desc: "Café-quality espresso at home with 15-bar pressure, steam wand, and fast heat-up." }),
  product({ slug: "edgepro-knife-set", name: "EdgePro Chef Knife Set", category: "kitchen", base: 85, rating: 4.6, reviews: 244, img: "photo-1593618998160-e34014e67546", desc: "Precision-forged stainless knives with an ergonomic grip and a handsome block." }),
  product({ slug: "crispair-xl-air-fryer", name: "CrispAir XL Air Fryer", category: "kitchen", base: 110, rating: 4.7, reviews: 633, deal: 18, img: "photo-1626074353765-517a681e40be", desc: "6.5L air fryer that crisps, roasts, and bakes with little to no oil." }),
  product({ slug: "proclad-cookware-set", name: "ProClad 10-Piece Cookware Set", category: "kitchen", base: 180, rating: 4.6, reviews: 188, img: "photo-1556910103-1c02745aae4d", desc: "Tri-ply stainless cookware with even heating, oven-safe handles, and lifetime durability." }),
  product({ slug: "vortexblend-pro", name: "VortexBlend Pro Blender", category: "kitchen", base: 95, rating: 4.5, reviews: 291, img: "photo-1570222094114-d054a817e56b", desc: "High-torque blender that crushes ice, blends smoothies, and makes hot soup." }),

  // ───────────────────────── Furniture (curated) ─────────────────────────
  product({ slug: "long-chair-curved", name: "Long Chair", category: "furniture", base: 430, markup: 18.1, rating: 4.9, reviews: 284, featured: true, deal: 25, supplier: "Nordic Home Direct", dmin: 5, dmax: 10, badge: "New Deals", img: "photo-1555041469-a586c61ea9bc", desc: "A sculptural curved sofa with premium textured upholstery, perfect for modern living spaces." }),
  product({ slug: "minimal-oak-armchair", name: "Oak Frame Armchair", category: "furniture", base: 289, rating: 4.9, reviews: 156, featured: true, deal: 60, supplier: "Artisan Loft Co.", dmin: 3, dmax: 7, badge: "Great Value", img: "photo-1567538096630-e0c55bd6374c", desc: "Minimalist armchair with solid oak legs and neutral upholstery at an unbeatable price." }),
  product({ slug: "purespace-focus-duo", name: "PureSpace Focus Duo", category: "furniture", base: 620, rating: 4.8, reviews: 98, stock: "sourced", featured: true, exclusive: true, supplier: "Studio Essentials", dmin: 7, dmax: 14, badge: "EXCLUSIVE", img: "photo-1586023492125-27b2c045efd7", desc: "Sleek, minimalist design meets exceptional comfort. An exclusive piece made with premium materials." }),
  product({ slug: "scandi-dining-table", name: "Scandinavian Dining Table", category: "furniture", base: 340, markup: 17.9, rating: 4.6, reviews: 72, supplier: "FlatPack Pro", dmin: 4, dmax: 8, img: "photo-1577140917170-285929fb55b7", desc: "Clean-lined dining table in natural birch with comfortable seating for six." }),
  product({ slug: "cloud-comfort-bed", name: "Cloud Comfort Bed Frame", category: "furniture", base: 510, rating: 4.8, reviews: 201, supplier: "SleepWell Supply", dmin: 6, dmax: 12, img: "photo-1505693416388-ac5ce068fe85", desc: "Platform bed frame with a plush upholstered headboard in soft grey." }),
  product({ slug: "walnut-six-drawer", name: "Walnut Six-Drawer Dresser", category: "furniture", base: 480, markup: 17.9, rating: 4.7, reviews: 89, deal: 35, supplier: "Heritage Wood Co.", dmin: 7, dmax: 14, img: "photo-1595428774223-ef52624120d2", desc: "Mid-century dresser in rich walnut with smooth soft-close drawers." }),
  product({ slug: "modular-sectional-grey", name: "Modular Sectional, Cloud Grey", category: "furniture", base: 890, rating: 4.9, reviews: 312, featured: true, supplier: "Comfort Direct", dmin: 8, dmax: 16, img: "photo-1493663284031-b7e3aefcae8e", desc: "Configurable sectional sofa with deep seats and removable, washable covers." }),

  // ───────────────────────── Fashion ─────────────────────────
  product({ slug: "everyday-leather-sneakers", name: "Everyday Leather Sneakers", category: "fashion", base: 90, rating: 4.6, reviews: 421, deal: 20, img: "photo-1525966222134-fcfa99b8ae77", desc: "Minimal leather sneakers with cushioned soles that go with absolutely everything." }),
  product({ slug: "weekender-canvas-bag", name: "Weekender Canvas Bag", category: "fashion", base: 65, rating: 4.7, reviews: 198, img: "photo-1547949003-9792a18a2601", desc: "Durable waxed-canvas weekender with leather trim and a roomy interior." }),
  product({ slug: "aviator-sunglasses", name: "Classic Aviator Sunglasses", category: "fashion", base: 35, rating: 4.5, reviews: 356, img: "photo-1572635196237-14b3f281503f", desc: "Timeless aviators with polarized lenses and a lightweight metal frame." }),
  product({ slug: "merino-wool-beanie", name: "Merino Wool Beanie", category: "fashion", base: 24, rating: 4.6, reviews: 142, img: "photo-1576871337622-98d48d1cf531", desc: "Soft, itch-free merino beanie that keeps its shape season after season." }),
  product({ slug: "minimalist-watch", name: "Minimalist Quartz Watch", category: "fashion", base: 80, rating: 4.7, reviews: 267, featured: true, img: "photo-1524592094714-0f0654e20314", desc: "Understated watch with a clean dial, sapphire glass, and an interchangeable strap." }),

  // ───────────────────────── Beauty ─────────────────────────
  product({ slug: "glow-serum-vitamin-c", name: "Glow Vitamin C Serum", category: "beauty", base: 28, rating: 4.7, reviews: 689, deal: 15, img: "photo-1620916566398-39f1143ab7be", desc: "Brightening vitamin C serum that evens tone and adds a healthy, radiant glow." }),
  product({ slug: "silk-hair-dryer", name: "SilkAir Ionic Hair Dryer", category: "beauty", base: 95, rating: 4.6, reviews: 233, img: "photo-1522338242992-e1a54906a8da", desc: "Fast, quiet ionic dryer that cuts frizz and protects shine with smart heat control." }),
  product({ slug: "spa-skincare-set", name: "At-Home Spa Skincare Set", category: "beauty", base: 55, rating: 4.8, reviews: 312, featured: true, img: "photo-1596462502278-27bfdc403348", desc: "A complete cleanse-tone-hydrate ritual with clean, cruelty-free formulas." }),
  product({ slug: "grooming-kit-pro", name: "Pro Grooming Kit", category: "beauty", base: 45, rating: 4.5, reviews: 178, img: "photo-1621607512214-68297480165e", desc: "Cordless trimmer set with precision guards for a sharp look at home." }),

  // ───────────────────────── Sports & Outdoors ─────────────────────────
  product({ slug: "adjustable-dumbbell", name: "FlexWeight Adjustable Dumbbell", category: "sports", base: 130, rating: 4.7, reviews: 421, featured: true, deal: 20, badge: "Best Seller", img: "photo-1638536532686-d610adfc8e5c", desc: "One dumbbell that replaces a rack, dial from 5 to 52 lbs in seconds." }),
  product({ slug: "yoga-mat-pro", name: "GripPro Yoga Mat", category: "sports", base: 38, rating: 4.6, reviews: 533, img: "photo-1601925260368-ae2f83cf8b7f", desc: "Extra-thick non-slip mat with alignment lines and a carry strap." }),
  product({ slug: "insulated-water-bottle", name: "TrailKeep Insulated Bottle", category: "sports", base: 28, rating: 4.8, reviews: 814, img: "photo-1602143407151-7111542de6e8", desc: "Keeps drinks cold 24h or hot 12h with a leakproof lid and rugged finish." }),
  product({ slug: "trail-running-shoes", name: "Summit Trail Running Shoes", category: "sports", base: 110, rating: 4.6, reviews: 289, deal: 18, img: "photo-1542291026-7eec264c27ff", desc: "Grippy, responsive trail shoes built for distance on any terrain." }),
  product({ slug: "camping-tent-2p", name: "Basecamp 2-Person Tent", category: "sports", base: 150, rating: 4.5, reviews: 167, stock: "low_stock", img: "photo-1504280390367-361c6d9f38f4", desc: "Lightweight weatherproof tent that pitches in minutes for two." }),

  // ───────────────────────── Gaming ─────────────────────────
  product({ slug: "nexus-pro-controller", name: "Nexus Pro Controller", category: "gaming", base: 70, rating: 4.7, reviews: 612, featured: true, img: "photo-1592840496694-26d035b52b48", desc: "Precision controller with remappable paddles, hair triggers, and low-latency wireless." }),
  product({ slug: "rgb-gaming-headset", name: "Vortex RGB Gaming Headset", category: "gaming", base: 65, rating: 4.5, reviews: 388, deal: 25, badge: "Hot Deal", img: "photo-1599669454699-248893623440", desc: "Surround-sound headset with a noise-canceling mic and plush memory-foam earcups." }),
  product({ slug: "gaming-chair-ergo", name: "ErgoRacer Gaming Chair", category: "gaming", base: 220, rating: 4.6, reviews: 254, img: "photo-1598550476439-6847785fcea6", desc: "Reclining ergonomic chair with lumbar support for marathon sessions." }),
  product({ slug: "mechanical-numpad", name: "Compact Streaming Deck", category: "gaming", base: 90, rating: 4.6, reviews: 121, img: "photo-1542751110-97427bbecf20", desc: "Programmable key deck to launch scenes, macros, and apps with one tap." }),

  // ───────────────────────── Toys & Games ─────────────────────────
  product({ slug: "build-blocks-1000", name: "MegaBuild 1000-Piece Blocks", category: "toys", base: 40, rating: 4.8, reviews: 512, featured: true, img: "photo-1558060370-d644479cb6f7", desc: "Endless creativity with 1,000 compatible building blocks in vivid colors." }),
  product({ slug: "wooden-train-set", name: "Classic Wooden Train Set", category: "toys", base: 35, rating: 4.7, reviews: 233, img: "photo-1596461404969-9ae70f2830c1", desc: "Heirloom-quality wooden railway with bridges, tracks, and engines." }),
  product({ slug: "strategy-board-game", name: "Conquer Strategy Board Game", category: "toys", base: 45, rating: 4.6, reviews: 178, deal: 15, img: "photo-1610890716171-6b1bb98ffd09", desc: "A modern tabletop classic for game nights, easy to learn, hard to master." }),
  product({ slug: "plush-bear-deluxe", name: "Cuddle Deluxe Plush Bear", category: "toys", base: 25, rating: 4.9, reviews: 421, img: "photo-1559454403-b8fb88521f11", desc: "Irresistibly soft plush bear that becomes an instant favorite." }),

  // ───────────────────────── Garden & Tools ─────────────────────────
  product({ slug: "cordless-drill-kit", name: "PowerDrive Cordless Drill Kit", category: "garden", base: 95, rating: 4.7, reviews: 367, featured: true, deal: 20, img: "photo-1504148455328-c376907d081c", desc: "Brushless 20V drill with two batteries, charger, and a bit set for every job." }),
  product({ slug: "raised-garden-bed", name: "Harvest Raised Garden Bed", category: "garden", base: 70, rating: 4.6, reviews: 142, img: "photo-1416879595882-3373a0480b5b", desc: "Easy-assemble raised bed for veggies and herbs on any patio or yard." }),
  product({ slug: "tool-set-108pc", name: "108-Piece Home Tool Set", category: "garden", base: 60, rating: 4.5, reviews: 289, img: "photo-1530124566582-a618bc2615dc", desc: "A complete toolkit in a sturdy case with everything for repairs and DIY." }),
  product({ slug: "led-string-lights", name: "Patio LED String Lights", category: "garden", base: 30, rating: 4.7, reviews: 533, img: "photo-1467810563316-b5476525c0f9", desc: "Weatherproof Edison string lights that make any outdoor space glow." }),

  // ───────────────────────── Pet Supplies ─────────────────────────
  product({ slug: "orthopedic-pet-bed", name: "Orthopedic Pet Bed", category: "pets", base: 55, rating: 4.8, reviews: 421, featured: true, img: "photo-1601758228041-f3b2795255f1", desc: "Memory-foam pet bed with a washable cover that supports joints and sleep." }),
  product({ slug: "interactive-cat-toy", name: "Interactive Cat Laser Toy", category: "pets", base: 25, rating: 4.6, reviews: 312, deal: 15, img: "photo-1545249390-6bdfa286032f", desc: "Auto-rotating laser toy that keeps curious cats entertained for hours." }),
  product({ slug: "dog-leash-set", name: "Adventure Dog Leash Set", category: "pets", base: 30, rating: 4.7, reviews: 198, img: "photo-1518717758536-85ae29035b6d", desc: "Padded no-pull harness and leash set built for daily walks and trails." }),
  product({ slug: "pet-water-fountain", name: "PureFlow Pet Water Fountain", category: "pets", base: 40, rating: 4.5, reviews: 156, img: "photo-1591946614720-90a587da4a36", desc: "Filtered circulating fountain that encourages pets to stay hydrated." }),

  // ───────────────────────── Books & Stationery ─────────────────────────
  product({ slug: "leather-journal", name: "Refillable Leather Journal", category: "books", base: 24, rating: 4.8, reviews: 389, featured: true, img: "photo-1531346878377-a5be20888e57", desc: "Hand-bound refillable journal with thick, fountain-pen-friendly paper." }),
  product({ slug: "fountain-pen-set", name: "Calligraphy Fountain Pen Set", category: "books", base: 35, rating: 4.6, reviews: 142, img: "photo-1583485088034-697b5bc54ccd", desc: "Smooth-writing fountain pens with assorted nibs and vibrant inks." }),
  product({ slug: "desk-organizer", name: "Bamboo Desk Organizer", category: "books", base: 28, rating: 4.7, reviews: 233, deal: 10, img: "photo-1544816155-12df9643f363", desc: "Tidy your workspace with a warm bamboo organizer for pens, notes, and devices." }),
  product({ slug: "bestseller-box-set", name: "Modern Classics Box Set", category: "books", base: 45, rating: 4.9, reviews: 178, img: "photo-1512820790803-83ca734da794", desc: "A beautifully bound collection of must-read modern classics." }),
];

export function mapProductToCard(product: Product): ProductCardData {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? undefined,
    price: product.retail_price,
    currency: product.currency,
    rating: product.rating,
    imageUrl: product.enhanced_image_url ?? product.image_url ?? "",
    category: product.category,
    isDeal: product.is_deal,
    dealLabel: product.deal_discount_percent
      ? `${product.deal_discount_percent}% off`
      : undefined,
    dealDiscountPercent: product.deal_discount_percent ?? undefined,
    isExclusive: product.is_exclusive,
  };
}

function withIds(items: SeedProduct[]): Product[] {
  return items.map((p, index) => ({
    ...p,
    id: `seed-${index}`,
    created_at: new Date(Date.now() - index * 3600_000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

const SEEDED: Product[] = withIds(SEED_PRODUCTS);

export function getProductBySlugSeed(slug: string): Product | undefined {
  return SEEDED.find((p) => p.slug === slug);
}

export function getFeaturedProduct(): ProductCardData {
  const featured =
    SEEDED.find((p) => p.slug === "long-chair-curved") ?? SEEDED[0];
  return mapProductToCard(featured);
}

export function getDealProduct(): ProductCardData {
  const deal =
    SEEDED.find((p) => p.slug === "minimal-oak-armchair") ??
    SEEDED.find((p) => p.is_deal) ??
    SEEDED[0];
  return mapProductToCard(deal);
}

export function getExclusiveProduct(): ProductCardData {
  const exclusive =
    SEEDED.find((p) => p.slug === "purespace-focus-duo") ??
    SEEDED.find((p) => p.is_exclusive) ??
    SEEDED[0];
  return mapProductToCard(exclusive);
}

export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "rating";

function sortProducts(items: Product[], sort?: SortKey): Product[] {
  const copy = [...items];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.retail_price - b.retail_price);
    case "price_desc":
      return copy.sort((a, b) => b.retail_price - a.retail_price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "featured":
    default:
      return copy.sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured) || b.rating - a.rating,
      );
  }
}

export interface SeedFilterOptions {
  category?: ProductCategory | string;
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  featuredOnly?: boolean;
  dealsOnly?: boolean;
}

function applyFilters(options: SeedFilterOptions): Product[] {
  const { category, query, featuredOnly, dealsOnly } = options;
  let results = SEEDED;

  if (category && category !== "all") {
    results = results.filter((p) => p.category === category);
  }
  if (featuredOnly) results = results.filter((p) => p.is_featured);
  if (dealsOnly) results = results.filter((p) => p.is_deal);

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.includes(q),
    );
  }

  return sortProducts(results, options.sort);
}

export function filterSeedProducts(options: SeedFilterOptions): Product[] {
  const { page = 1, pageSize = 12 } = options;
  const results = applyFilters(options);
  const start = (page - 1) * pageSize;
  return results.slice(start, start + pageSize);
}

export function countSeedProducts(options: SeedFilterOptions): number {
  return applyFilters({ ...options, page: 1, pageSize: Number.MAX_SAFE_INTEGER }).length;
}

export function getRelatedSeedProducts(
  slug: string,
  category: string,
  limit = 4,
): Product[] {
  return SEEDED.filter((p) => p.category === category && p.slug !== slug).slice(0, limit);
}

export function countByCategory(): Record<string, number> {
  return SEEDED.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}
