import type { PaystackPaymentPurpose } from "@/config/paystack";

export interface PaystackInitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResult {
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  channel?: string;
  authorization?: {
    authorization_code?: string;
    customer_code?: string;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    card_type?: string;
    bank?: string;
  };
  metadata?: PaystackPaymentMetadata;
}

export interface PaystackPaymentMetadata {
  purpose: PaystackPaymentPurpose;
  orderNumber?: string;
  sellerId?: string;
  plan?: string;
  paymentMethod?: string;
}
