import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";

export async function GET() {
  const staff = await getCurrentStaff();
  return NextResponse.json({ staff: staff ? { id: staff.id, email: staff.email, role: staff.role } : null });
}
