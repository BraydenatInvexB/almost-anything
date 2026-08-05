/**
 * Provisions an approved demo driver account in Supabase for QA.
 * Usage: npm run seed:demo-driver
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { DEMO_DRIVER } from "../src/config/demo-driver";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
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

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init?.headers } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message ?? data?.error ?? text ?? response.statusText);
  return data as T;
}

async function ensureUser() {
  const listed = await api<{ users: { id: string; email?: string }[] }>("/auth/v1/admin/users?page=1&per_page=1000");
  const existing = listed.users.find((user) => user.email?.toLowerCase() === DEMO_DRIVER.email.toLowerCase());
  if (existing) {
    await api(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({
        password: DEMO_DRIVER.password,
        email_confirm: true,
        user_metadata: { full_name: DEMO_DRIVER.fullName, role: "driver" },
      }),
    });
    return existing.id;
  }
  const created = await api<{ id: string } | { user: { id: string } }>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: DEMO_DRIVER.email,
      password: DEMO_DRIVER.password,
      email_confirm: true,
      user_metadata: { full_name: DEMO_DRIVER.fullName, role: "driver" },
    }),
  });
  return "user" in created ? created.user.id : created.id;
}

async function ensureDriver(userId: string) {
  const existing = await api<{ id: string }[]>(`/rest/v1/drivers?email=eq.${encodeURIComponent(DEMO_DRIVER.email)}&select=id`);
  const payload = {
    user_id: userId,
    email: DEMO_DRIVER.email,
    full_name: DEMO_DRIVER.fullName,
    phone: DEMO_DRIVER.phone,
    province: DEMO_DRIVER.province,
    vehicle_notes: DEMO_DRIVER.vehicleNotes,
    status: "active",
    notes: "Approved demo driver for dashboard testing.",
    updated_at: new Date().toISOString(),
  };
  if (existing[0]?.id) {
    await api(`/rest/v1/drivers?id=eq.${existing[0].id}`, { method: "PATCH", body: JSON.stringify(payload) });
    return existing[0].id;
  }
  const inserted = await api<{ id: string }[]>("/rest/v1/drivers?select=id", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return inserted[0].id;
}

async function main() {
  console.log("Seeding demo driver…");
  const userId = await ensureUser();
  const driverId = await ensureDriver(userId);
  console.log("\nDemo driver ready:\n");
  console.log(`  Email:     ${DEMO_DRIVER.email}`);
  console.log(`  Password:  ${DEMO_DRIVER.password}`);
  console.log(`  Login:     ${DEMO_DRIVER.loginUrl}`);
  console.log(`  Dashboard: ${DEMO_DRIVER.dashboardUrl}`);
  console.log(`  Driver ID: ${driverId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
