import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getStaffProfile, listStaff } from "@/services/admin-service";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const schema = z.object({ staffId: z.string().min(1) });

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not available in live mode" }, { status: 400 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profile = getStaffProfile(parsed.data.staffId);
  if (!profile) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set("demo_admin_staff_id", parsed.data.staffId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true, staff: profile });
}

export async function GET() {
  if (isSupabaseConfigured()) {
    return NextResponse.json({ live: true });
  }
  const staff = await listStaff();
  const cookieStore = await cookies();
  const id = cookieStore.get("demo_admin_staff_id")?.value;
  return NextResponse.json({
    staffId: id,
    staff: id ? getStaffProfile(id) : null,
    options: staff,
  });
}
