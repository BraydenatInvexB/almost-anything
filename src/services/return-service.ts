import {
  createReturn,
  getCheckoutOrder,
  listReturns,
  listReturnsByEmail,
} from "@/lib/admin/operations-store";
import type {
  ReturnLineItem,
  ReturnMethod,
  ReturnReasonCode,
  ReturnRequest,
} from "@/lib/admin/operations-types";
import { findDemoOrder } from "@/lib/orders/demo-track";
import {
  canReturnOrder,
  computeRefundAmount,
  hasOpenReturn,
  orderToReturnItems,
} from "@/lib/returns/returns";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrderByNumber, getOrdersForUser } from "@/services/order-service";
import type { Order } from "@/types/cart";

export interface SubmitReturnInput {
  orderNumber: string;
  customerEmail: string;
  reasonCode: ReturnReasonCode;
  reason: string;
  method: ReturnMethod;
  itemIds?: string[];
  customerName?: string;
  userId?: string;
}

async function resolveOrderForReturn(
  orderNumber: string,
  customerEmail: string,
): Promise<Order | null> {
  const q = orderNumber.trim();
  const email = customerEmail.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const order = await getOrderByNumber(q);
    if (order && order.shippingAddress.email.toLowerCase() === email) {
      return order;
    }
  }

  const checkout = getCheckoutOrder(q);
  if (checkout && checkout.customerEmail.toLowerCase() === email) {
    return {
      id: checkout.id,
      orderNumber: checkout.orderNumber,
      status: checkout.status as Order["status"],
      items: checkout.lineItems.map((li) => ({
        id: li.id,
        name: li.name,
        price: li.unitPrice,
        quantity: li.quantity,
        imageUrl: li.imageUrl,
        type: "product" as const,
      })),
      subtotal: checkout.subtotal,
      shipping: checkout.shippingCost,
      tax: checkout.tax,
      total: checkout.total,
      currency: checkout.currency,
      shippingAddress: {
        fullName: checkout.shippingAddress.fullName,
        email: checkout.shippingAddress.email,
        phone: checkout.shippingAddress.phone ?? "",
        addressLine1: checkout.shippingAddress.line1,
        addressLine2: checkout.shippingAddress.line2,
        city: checkout.shippingAddress.city,
        state: checkout.shippingAddress.province,
        postalCode: checkout.shippingAddress.postalCode,
        country: checkout.shippingAddress.country,
      },
      paymentMethod: checkout.paymentMethod,
      createdAt: checkout.createdAt,
    };
  }

  const demo = findDemoOrder(q);
  if (demo) {
    return {
      id: `demo-${demo.orderNumber}`,
      orderNumber: demo.orderNumber,
      status: demo.status,
      items: demo.items.map((item, i) => ({
        id: `demo-item-${i}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        type: "product" as const,
      })),
      subtotal: demo.total,
      shipping: 0,
      tax: 0,
      total: demo.total,
      currency: "ZAR",
      shippingAddress: {
        fullName: demo.recipient,
        email,
        phone: "",
        addressLine1: "Demo address",
        city: demo.city,
        state: "",
        postalCode: "",
        country: "South Africa",
      },
      paymentMethod: "card",
      createdAt: demo.placedAt,
    };
  }

  return null;
}

export async function submitReturnRequest(
  input: SubmitReturnInput,
): Promise<{ return: ReturnRequest } | { error: string }> {
  const order = await resolveOrderForReturn(input.orderNumber, input.customerEmail);
  if (!order) {
    return { error: "Order not found or email does not match our records." };
  }

  const eligibility = canReturnOrder(order.status, order.createdAt);
  if (!eligibility.ok) {
    return { error: eligibility.reason ?? "This order cannot be returned." };
  }

  const existing = listReturns();
  if (hasOpenReturn(existing, order.id, order.orderNumber)) {
    return { error: "A return is already in progress for this order." };
  }

  const items: ReturnLineItem[] = orderToReturnItems(order, input.itemIds);
  if (items.length === 0) {
    return { error: "Select at least one item to return." };
  }

  const ret = createReturn({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: input.userId,
    customerName: input.customerName ?? order.shippingAddress.fullName,
    customerEmail: input.customerEmail.trim().toLowerCase(),
    reasonCode: input.reasonCode,
    reason: input.reason.trim(),
    items,
    method: input.method,
    refundAmount: computeRefundAmount(items),
    currency: order.currency,
    restockItems: true,
  });

  return { return: ret };
}

export async function getCustomerReturns(userId?: string, email?: string): Promise<ReturnRequest[]> {
  if (userId && isSupabaseConfigured()) {
    try {
      const orders = await getOrdersForUser(userId);
      const all = listReturns();
      const orderIds = new Set(orders.map((o) => o.id));
      const orderNumbers = new Set(orders.map((o) => o.orderNumber));
      return all.filter(
        (r) => orderIds.has(r.orderId) || orderNumbers.has(r.orderNumber) || r.customerId === userId,
      );
    } catch {
      /* fall through */
    }
  }

  if (email) {
    return listReturnsByEmail(email);
  }

  return [];
}

export async function getAuthenticatedCustomerReturns(): Promise<ReturnRequest[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    return getCustomerReturns(user.id, user.email ?? undefined);
  } catch {
    return [];
  }
}

export function listAllReturns(): ReturnRequest[] {
  return listReturns();
}
