import { NextResponse } from "next/server";
import { getCurrentSeller } from "@/services/seller-service";

export async function GET() {
  const seller = await getCurrentSeller();
  if (!seller) {
    return NextResponse.json({ seller: null }, { status: 401 });
  }

  return NextResponse.json({
    seller: {
      id: seller.id,
      plan: seller.plan,
      subscriptionStatus: seller.subscriptionStatus,
      shopName: seller.shopName,
    },
  });
}
