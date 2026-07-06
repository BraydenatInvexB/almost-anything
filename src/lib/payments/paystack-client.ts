import "server-only";
import { PAYSTACK_CURRENCY } from "@/config/paystack";
import type { PaystackInitializeResult, PaystackVerifyResult } from "@/lib/payments/paystack-types";

const PAYSTACK_API = "https://api.paystack.co";

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.includes("xxx")) {
    throw new Error("Paystack secret key is not configured.");
  }
  return key;
}

export function toPaystackAmount(amountZar: number): number {
  return Math.round(amountZar * 100);
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackEnvelope<T>;
  if (!json.status) {
    throw new Error(json.message || "Paystack request failed.");
  }
  return json.data;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountZar: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  channels?: string[];
}): Promise<PaystackInitializeResult> {
  return paystackRequest<PaystackInitializeResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: toPaystackAmount(input.amountZar),
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      channels: input.channels,
      currency: PAYSTACK_CURRENCY,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  const data = await paystackRequest<PaystackVerifyResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return data;
}

export async function chargePaystackAuthorization(input: {
  authorizationCode: string;
  email: string;
  amountZar: number;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackVerifyResult> {
  return paystackRequest<PaystackVerifyResult>("/transaction/charge_authorization", {
    method: "POST",
    body: JSON.stringify({
      authorization_code: input.authorizationCode,
      email: input.email,
      amount: toPaystackAmount(input.amountZar),
      reference: input.reference,
      currency: PAYSTACK_CURRENCY,
      metadata: input.metadata,
    }),
  });
}
