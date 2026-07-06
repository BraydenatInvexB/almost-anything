/**
 * Provisions a demo seller account in Supabase for QA.
 * Usage: npm run seed:demo-seller
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { DEMO_SELLER, DEMO_SELLER_PRODUCTS } from "../src/config/demo-seller";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const adminHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${url}${path}`, { ...init, headers: { ...adminHeaders, ...init?.headers } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? text ?? res.statusText);
  }
  return data as T;
}

async function ensureAuthUser(): Promise<string> {
  const listed = await api<{ users: { id: string; email?: string }[] }>(
    "/auth/v1/admin/users?page=1&per_page=1000",
  );

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === DEMO_SELLER.email.toLowerCase(),
  );

  if (existing) {
    await api(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        password: DEMO_SELLER.password,
        email_confirm: true,
        user_metadata: { full_name: DEMO_SELLER.shopName, role: "seller" },
      }),
    });
    return existing.id;
  }

  const created = await api<{ id: string } | { user: { id: string } }>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: DEMO_SELLER.email,
      password: DEMO_SELLER.password,
      email_confirm: true,
      user_metadata: { full_name: DEMO_SELLER.shopName, role: "seller" },
    }),
  });

  return "user" in created && created.user ? created.user.id : (created as { id: string }).id;
}

async function ensureSeller(userId: string): Promise<string> {
  const existing = await api<{ id: string }[]>(
    `/rest/v1/sellers?slug=eq.${encodeURIComponent(DEMO_SELLER.slug)}&select=id`,
  );

  const payload = {
    user_id: userId,
    shop_name: DEMO_SELLER.shopName,
    slug: DEMO_SELLER.slug,
    description: "Demo seller shop for testing the marketplace seller portal.",
    company_name: DEMO_SELLER.companyName,
    entity_type: "private_company",
    registration_number: "2026/123456/07",
    vat_number: "4123456789",
    contact_email: DEMO_SELLER.email,
    contact_phone: DEMO_SELLER.contactPhone,
    business_address: {
      line1: "12 Demo Street",
      city: "Johannesburg",
      state: "Gauteng",
      postalCode: "2000",
      country: "ZA",
    },
    category_slugs: ["electronics", "home"],
    sells_all_categories: false,
    status: "approved",
    plan: "growth_50",
    subscription_status: "trial",
    preferred_couriers: ["aramex", "pudo"],
    metadata: { demo: true, seededAt: new Date().toISOString() },
  };

  if (existing[0]?.id) {
    await api(`/rest/v1/sellers?id=eq.${existing[0].id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return existing[0].id;
  }

  const inserted = await api<{ id: string }[]>(
    "/rest/v1/sellers?select=id",
    { method: "POST", body: JSON.stringify(payload), headers: { Prefer: "return=representation" } },
  );

  return inserted[0].id;
}

async function ensureTeamMember(sellerId: string, userId: string) {
  const existing = await api<{ id: string }[]>(
    `/rest/v1/seller_team_members?seller_id=eq.${sellerId}&email=eq.${encodeURIComponent(DEMO_SELLER.email)}&select=id`,
  );

  const payload = {
    seller_id: sellerId,
    user_id: userId,
    email: DEMO_SELLER.email,
    full_name: DEMO_SELLER.shopName,
    role: "owner",
    status: "active",
    permissions: [],
  };

  if (existing[0]?.id) {
    await api(`/rest/v1/seller_team_members?id=eq.${existing[0].id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return;
  }

  await api("/rest/v1/seller_team_members", { method: "POST", body: JSON.stringify(payload) });
}

async function ensureProducts(sellerId: string) {
  for (const product of DEMO_SELLER_PRODUCTS) {
    const slug = `demo-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
    const existing = await api<{ id: string }[]>(
      `/rest/v1/products?seller_id=eq.${sellerId}&slug=eq.${encodeURIComponent(slug)}&select=id`,
    );

    const row = {
      slug,
      name: product.name,
      description: product.description,
      category: product.category,
      base_price: product.costPrice,
      retail_price: product.retailPrice,
      markup_percent: product.markupPercent,
      currency: "ZAR",
      seller_id: sellerId,
      stock_quantity: product.stockQuantity,
      listing_status: "published",
      delivery_days_min: 2,
      delivery_days_max: 5,
      metadata: {
        demo: true,
        sellerListing: true,
        seller_delivery: { customer_pays: true, fee_zar: null },
      },
    };

    if (existing[0]?.id) {
      await api(`/rest/v1/products?id=eq.${existing[0].id}`, {
        method: "PATCH",
        body: JSON.stringify(row),
      });
    } else {
      await api("/rest/v1/products", { method: "POST", body: JSON.stringify(row) });
    }
  }
}

async function main() {
  console.log("Seeding demo seller…");
  const userId = await ensureAuthUser();
  const sellerId = await ensureSeller(userId);
  await ensureTeamMember(sellerId, userId);
  await ensureProducts(sellerId);

  console.log("\nDemo seller ready:\n");
  console.log(`  Email:      ${DEMO_SELLER.email}`);
  console.log(`  Password:   ${DEMO_SELLER.password}`);
  console.log(`  Login:      ${DEMO_SELLER.loginUrl}`);
  console.log(`  Dashboard:  ${DEMO_SELLER.sellerDashboardUrl}`);
  console.log(`  Storefront: ${DEMO_SELLER.storefrontUrl}`);
  console.log(`  Admin:      /admin/sellers/${sellerId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
