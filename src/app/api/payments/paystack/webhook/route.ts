import { NextRequest } from "next/server";
import { verifyPaystackTransaction } from "@/lib/payments/paystack-client";
import { fulfillPaystackPayment } from "@/lib/payments/paystack-fulfillment";
import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack-webhook";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string; status?: string } };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (payload.event !== "charge.success" || !payload.data?.reference) {
    return new Response("Ignored", { status: 200 });
  }

  try {
    const verification = await verifyPaystackTransaction(payload.data.reference);
    if (verification.status === "success") {
      await fulfillPaystackPayment(verification);
    }
  } catch {
    // Paystack retries webhooks; swallow duplicate fulfillment errors.
  }

  return new Response("OK", { status: 200 });
}
