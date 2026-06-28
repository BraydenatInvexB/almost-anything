import { NextRequest, NextResponse } from "next/server";
import { getCheckoutOrder } from "@/lib/admin/operations-store";
import { getOrderByNumber } from "@/services/order-service";
import { findDemoOrder } from "@/lib/orders/demo-track";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("orderNumber")?.trim();
  if (!orderNumber) {
    return NextResponse.json({ error: "Order number required" }, { status: 400 });
  }

  const live = getCheckoutOrder(orderNumber);
  if (live) {
    const eta = new Date(live.createdAt);
    eta.setDate(eta.getDate() + (live.stockOrigin === "overseas" ? 14 : 5));
    return NextResponse.json({
      orderNumber: live.orderNumber,
      placedAt: live.createdAt,
      estimatedDelivery: eta.toISOString(),
      status: live.status === "paid" ? "processing" : live.status,
      carrier: live.carrier ?? live.courierName,
      trackingNumber: live.trackingNumber ?? "",
      recipient: live.shippingAddress.fullName,
      city: `${live.shippingAddress.city}, ${live.shippingAddress.country}`,
      total: live.total,
      items: live.lineItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice * item.quantity,
        imageUrl: item.imageUrl ?? "/placeholder-product.png",
      })),
    });
  }

  if (isSupabaseConfigured()) {
    const order = await getOrderByNumber(orderNumber);
    if (order) {
      const eta = new Date(order.createdAt);
      eta.setDate(eta.getDate() + 7);
      return NextResponse.json({
        orderNumber: order.orderNumber,
        placedAt: order.createdAt,
        estimatedDelivery: eta.toISOString(),
        status: order.status,
        carrier: "Aramex",
        trackingNumber: "",
        recipient: order.shippingAddress.fullName,
        city: `${order.shippingAddress.city}, ${order.shippingAddress.country}`,
        total: order.total,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity,
          imageUrl: item.imageUrl ?? "/placeholder-product.png",
        })),
      });
    }
  }

  const demo = findDemoOrder(orderNumber);
  if (demo) {
    return NextResponse.json(demo);
  }

  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
