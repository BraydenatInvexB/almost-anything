/** Demo seller account for local/staging QA — run `npm run seed:demo-seller` to provision. */

export const DEMO_SELLER = {
  email: "demo.seller@almostanything.co.za",
  password: "DemoSeller2026!",
  shopName: "Demo Hardware Hub",
  slug: "demo-hardware-hub",
  companyName: "Demo Hardware (Pty) Ltd",
  contactPhone: "+27821234567",
  loginUrl: "/login?redirect=/seller",
  sellerDashboardUrl: "/seller",
  storefrontUrl: "/businesses/demo-hardware-hub",
} as const;

export const DEMO_SELLER_PRODUCTS = [
  {
    name: "Demo Cordless Drill Kit",
    category: "appliances" as const,
    costPrice: 650,
    markupPercent: 38.3,
    retailPrice: 899,
    stockQuantity: 24,
    description: "Sample marketplace listing for seller portal testing.",
  },
  {
    name: "Demo LED Work Light",
    category: "home" as const,
    costPrice: 240,
    markupPercent: 45.4,
    retailPrice: 349,
    stockQuantity: 40,
    description: "Second sample product for inventory and orders testing.",
  },
  {
    name: "Demo Safety Goggles (Pair)",
    category: "sports" as const,
    costPrice: 85,
    markupPercent: 51.8,
    retailPrice: 129,
    stockQuantity: 100,
    description: "Low-cost SKU for promo and checkout experiments.",
  },
] as const;
