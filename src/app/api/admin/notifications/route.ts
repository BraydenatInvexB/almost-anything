import { NextResponse } from "next/server";
import { getAdminNotificationSummary, getCurrentStaff } from "@/services/admin-service";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getAdminNotificationSummary(staff);
  return NextResponse.json(summary);
}
