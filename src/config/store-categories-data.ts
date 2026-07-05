import type { ProductCategory } from "@/types/database";

/**
 * Single source of truth for the storefront category taxonomy. Every category
 * pill, navigation link, and landing header is derived from this list so the
 * catalog, navigation, and product data never drift apart.
 */
export interface StoreCategory {
  slug: ProductCategory;
  label: string;
  /** Short shelf description shown on category landing pages. */
  blurb: string;
  /** Accent colour used for dots / chips. */
  color: string;
  /** lucide-react icon name, resolved where rendered. */
  icon: string;
  /** Representative image for category tiles. */
  image: string;
}
export const STORE_CATEGORIES: StoreCategory[] = [
  {
    slug: "electronics",
    label: "Electronics",
    blurb: "Gadgets, smart devices, and everyday tech.",
    color: "#3b82f6",
    icon: "Cpu",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop",
  },
  {
    slug: "computers",
    label: "Computers",
    blurb: "Laptops, monitors, and accessories.",
    color: "#6366f1",
    icon: "Laptop",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
  },
  {
    slug: "phones",
    label: "Phones & Tablets",
    blurb: "The latest phones, tablets, and add-ons.",
    color: "#0ea5e9",
    icon: "Smartphone",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=400&fit=crop",
  },
  {
    slug: "audio",
    label: "Audio",
    blurb: "Headphones, speakers, and sound gear.",
    color: "#f97316",
    icon: "Headphones",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
  },
  {
    slug: "home",
    label: "Home & Living",
    blurb: "Décor, lighting, and home essentials.",
    color: "#06b6d4",
    icon: "Lamp",
    image:
      "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=600&h=400&fit=crop",
  },
  {
    slug: "kitchen",
    label: "Kitchen",
    blurb: "Cookware, appliances, and dining.",
    color: "#ef4444",
    icon: "CookingPot",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop",
  },
  {
    slug: "furniture",
    label: "Furniture",
    blurb: "Sofas, tables, beds, and storage.",
    color: "#8b5cf6",
    icon: "Sofa",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
  },
  {
    slug: "fashion",
    label: "Fashion",
    blurb: "Clothing, shoes, and accessories.",
    color: "#ec4899",
    icon: "Shirt",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop",
  },
  {
    slug: "sleepwear",
    label: "Sleepwear",
    blurb: "Nightgowns, pajamas, robes, and loungewear.",
    color: "#a78bfa",
    icon: "Moon",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
  },
  {
    slug: "womens",
    label: "Women's",
    blurb: "Dresses, tops, skirts, and women's style.",
    color: "#db2777",
    icon: "Sparkle",
    image:
      "https://images.unsplash.com/photo-1490481651871-abd0af063d85?w=600&h=400&fit=crop",
  },
  {
    slug: "mens",
    label: "Men's",
    blurb: "Shirts, trousers, jackets, and men's wear.",
    color: "#1d4ed8",
    icon: "User",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=400&fit=crop",
  },
  {
    slug: "lingerie",
    label: "Lingerie & Underwear",
    blurb: "Bras, underwear, and intimate apparel.",
    color: "#be185d",
    icon: "Heart",
    image:
      "https://images.unsplash.com/photo-1520903920245-00c7104d22b9?w=600&h=400&fit=crop",
  },
  {
    slug: "jewelry",
    label: "Jewelry & Watches",
    blurb: "Rings, necklaces, bracelets, and timepieces.",
    color: "#ca8a04",
    icon: "Gem",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop",
  },
  {
    slug: "appliances",
    label: "Appliances",
    blurb: "Small and large home appliances.",
    color: "#64748b",
    icon: "Refrigerator",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&h=400&fit=crop",
  },
  {
    slug: "beauty",
    label: "Beauty",
    blurb: "Skincare, grooming, and wellness.",
    color: "#f43f5e",
    icon: "Sparkles",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop",
  },
  {
    slug: "sports",
    label: "Sports & Outdoors",
    blurb: "Fitness, gear, and the outdoors.",
    color: "#22c55e",
    icon: "Dumbbell",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop",
  },
  {
    slug: "gaming",
    label: "Gaming",
    blurb: "Consoles, controllers, and accessories.",
    color: "#a855f7",
    icon: "Gamepad2",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
  },
  {
    slug: "toys",
    label: "Toys & Games",
    blurb: "Fun for every age.",
    color: "#eab308",
    icon: "ToyBrick",
    image:
      "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&h=400&fit=crop",
  },
  {
    slug: "garden",
    label: "Garden & Tools",
    blurb: "Outdoor living and DIY.",
    color: "#16a34a",
    icon: "Trees",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
  },
  {
    slug: "pets",
    label: "Pet Supplies",
    blurb: "Everything for your companions.",
    color: "#14b8a6",
    icon: "PawPrint",
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop",
  },
  {
    slug: "books",
    label: "Books & Stationery",
    blurb: "Reads, journals, and supplies.",
    color: "#64748b",
    icon: "BookOpen",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop",
  },
  {
    slug: "travel",
    label: "Travel",
    blurb: "Luggage, bags, and travel essentials.",
    color: "#0284c7",
    icon: "Plane",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop",
  },
  {
    slug: "automotive",
    label: "Automotive",
    blurb: "Car accessories, parts, and care.",
    color: "#475569",
    icon: "Car",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop",
  },
  {
    slug: "health",
    label: "Health & Wellness",
    blurb: "Vitamins, medical supplies, and fitness aids.",
    color: "#10b981",
    icon: "HeartPulse",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
  },
  {
    slug: "baby",
    label: "Baby & Kids",
    blurb: "Nursery, feeding, and child essentials.",
    color: "#f472b6",
    icon: "Baby",
    image:
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop",
  },
  {
    slug: "office",
    label: "Office & School",
    blurb: "Desks, supplies, and workplace gear.",
    color: "#78716c",
    icon: "Briefcase",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  },
  {
    slug: "general",
    label: "Other",
    blurb: "Everything else in the catalog.",
    color: "#94a3b8",
    icon: "LayoutGrid",
    image:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop",
  },
];
