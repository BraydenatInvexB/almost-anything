import { NextResponse } from "next/server";
import { fulfillHostedPayment } from "@/lib/payments/provider-fulfillment";
import { paymentsTestMode } from "@/config/payment-providers";

function pick(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) if (record[key] !== undefined) return String(record[key]);
  return "";
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await request.json() as Record<string, unknown>
      : Object.fromEntries(Array.from((await request.formData()).entries()).map(([key, value]) => [key, String(value)]));
    const reference = pick(payload, "TransactionReference", "transactionReference");
    if (!reference) return new NextResponse("Missing reference", { status: 400 });

    const query = new URLSearchParams({
      siteCode: process.env.OZOW_SITE_CODE ?? "",
      transactionReference: reference,
      isTest: String(paymentsTestMode()),
    });
    const response = await fetch(`https://api.ozow.com/GetTransactionByReference?${query}`, {
      headers: { ApiKey: process.env.OZOW_API_KEY ?? "", Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return new NextResponse("Unable to verify transaction", { status: 400 });
    const result = await response.json() as Record<string, unknown> | Record<string, unknown>[];
    const nested = !Array.isArray(result) && (result.data ?? result.transactions);
    const candidates = Array.isArray(result)
      ? result
      : Array.isArray(nested)
        ? nested as Record<string, unknown>[]
        : [result];
    const transaction = candidates.find((entry) => pick(entry, "TransactionReference", "transactionReference") === reference);
    if (!transaction || pick(transaction, "Status", "status").toLowerCase() !== "complete") {
      return new NextResponse("Transaction is not complete", { status: 400 });
    }
    await fulfillHostedPayment({
      provider: "ozow",
      reference,
      amount: Number(pick(transaction, "Amount", "amount")),
      transactionId: pick(transaction, "TransactionId", "transactionId"),
    });
    return new NextResponse("OK");
  } catch {
    return new NextResponse("Unable to process notification", { status: 400 });
  }
}
