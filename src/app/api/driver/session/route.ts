import { NextResponse } from "next/server";
import { getCurrentDriver } from "@/services/delivery/drivers";

export async function GET() {
  const driver = await getCurrentDriver();
  if (!driver) {
    return NextResponse.json({ driver: null }, { status: 401 });
  }

  return NextResponse.json({
    driver: {
      id: driver.id,
      fullName: driver.fullName,
      email: driver.email,
      province: driver.province,
      status: driver.status,
    },
  });
}
