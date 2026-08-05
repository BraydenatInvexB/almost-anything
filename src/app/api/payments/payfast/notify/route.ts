import { NextResponse } from "next/server";
import { payfastSignature } from "@/lib/payments/provider-request";
import { fulfillHostedPayment } from "@/lib/payments/provider-fulfillment";
import { paymentsTestMode } from "@/config/payment-providers";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const fields = Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
    const signature = fields.signature;
    delete fields.signature;
    if (!signature || signature !== payfastSignature(fields, process.env.PAYFAST_PASSPHRASE ?? "")) {
      return new NextResponse("Invalid signature", { status: 400 });
    }
    if (fields.merchant_id !== process.env.PAYFAST_MERCHANT_ID) return new NextResponse("Invalid merchant", { status: 400 });

    const validationBody = new URLSearchParams(fields).toString();
    const validationUrl = paymentsTestMode()
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate";
    const validation = await fetch(validationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: validationBody,
      cache: "no-store",
    });
    if ((await validation.text()).trim() !== "VALID") return new NextResponse("Invalid notification", { status: 400 });

    if (fields.payment_status === "COMPLETE") {
      await fulfillHostedPayment({
        provider: "payfast",
        reference: fields.m_payment_id,
        amount: Number(fields.amount_gross),
        transactionId: fields.pf_payment_id,
      });
    }
    return new NextResponse("OK");
  } catch {
    return new NextResponse("Unable to process notification", { status: 400 });
  }
}
