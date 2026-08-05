import "server-only";
import { createHash } from "node:crypto";
import { paymentProviderIssue, paymentsTestMode, type PaymentProvider, type PaymentPurpose } from "@/config/payment-providers";

function origin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function payfastEncode(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, "+");
}

export function payfastSignature(fields: Record<string, string>, passphrase: string) {
  const source = Object.entries(fields).filter(([, value]) => value !== "").map(([key, value]) => `${key}=${payfastEncode(value)}`).join("&");
  return createHash("md5").update(`${source}&passphrase=${payfastEncode(passphrase)}`).digest("hex");
}

export function ozowHash(fields: Record<string, string>, privateKey: string) {
  return createHash("sha512").update(`${Object.values(fields).join("")}${privateKey}`.toLowerCase()).digest("hex");
}

export interface HostedPaymentRequest {
  provider: PaymentProvider;
  actionUrl: string;
  fields: Record<string, string>;
  reference: string;
}

export function createHostedPaymentRequest(input: {
  provider: PaymentProvider;
  purpose: PaymentPurpose;
  reference: string;
  amount: number;
  itemName: string;
  customerEmail: string;
}): HostedPaymentRequest {
  const issue = paymentProviderIssue(input.provider);
  if (issue) throw new Error(issue);
  const base = origin();
  const amount = input.amount.toFixed(2);

  if (input.provider === "payfast") {
    const fields: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${base}/payment/callback?provider=payfast&reference=${encodeURIComponent(input.reference)}`,
      cancel_url: `${base}/payment/cancelled?provider=payfast&reference=${encodeURIComponent(input.reference)}`,
      notify_url: `${base}/api/payments/payfast/notify`,
      email_address: input.customerEmail,
      m_payment_id: input.reference,
      amount,
      item_name: input.itemName.slice(0, 100),
      custom_str1: input.purpose,
    };
    fields.signature = payfastSignature(fields, process.env.PAYFAST_PASSPHRASE!);
    return {
      provider: "payfast",
      actionUrl: paymentsTestMode() ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process",
      fields,
      reference: input.reference,
    };
  }

  const fields: Record<string, string> = {
    SiteCode: process.env.OZOW_SITE_CODE!,
    CountryCode: "ZA",
    CurrencyCode: "ZAR",
    Amount: amount,
    TransactionReference: input.reference,
    BankReference: input.reference.slice(0, 20),
    Optional1: input.purpose,
    Optional2: "",
    Optional3: "",
    Optional4: "",
    Optional5: "",
    Customer: input.customerEmail,
    CancelUrl: `${base}/payment/cancelled?provider=ozow&reference=${encodeURIComponent(input.reference)}`,
    ErrorUrl: `${base}/payment/failed?provider=ozow&reference=${encodeURIComponent(input.reference)}`,
    SuccessUrl: `${base}/payment/callback?provider=ozow&reference=${encodeURIComponent(input.reference)}`,
    NotifyUrl: `${base}/api/payments/ozow/notify`,
    IsTest: String(paymentsTestMode()),
  };
  fields.HashCheck = ozowHash(fields, process.env.OZOW_PRIVATE_KEY!);
  return { provider: "ozow", actionUrl: "https://pay.ozow.com", fields, reference: input.reference };
}
