import { sellerDb } from "@/lib/seller/db";
import { mapSellerPayout } from "@/lib/seller/seller-mapper";
import type { SellerPayout } from "@/types/seller";

export interface SellerPayoutSummary {
  grossEarnings: number;
  requestedAmount: number;
  paidAmount: number;
  availableAmount: number;
  vatIncluded: number;
  netSalesExcludingVat: number;
  vatRegistered: boolean;
  payouts: SellerPayout[];
}

export async function getSellerPayoutSummary(sellerId: string, vatRegistered = false): Promise<SellerPayoutSummary> {
  const db = sellerDb();
  const [{ data: sales, error: salesError }, { data: payoutRows, error: payoutsError }] = await Promise.all([
    db.from("order_items").select("unit_price, quantity").eq("seller_id", sellerId),
    db.from("seller_payouts").select("*").eq("seller_id", sellerId).order("requested_at", { ascending: false }),
  ]);

  if (salesError) throw salesError;
  if (payoutsError) throw payoutsError;

  const grossEarnings = (sales ?? []).reduce(
    (total, item) => total + Number(item.unit_price) * Number(item.quantity),
    0,
  );
  const payouts = (payoutRows ?? []).map((row) => mapSellerPayout(row as Record<string, unknown>));
  const committedPayouts = payouts.filter((payout) => payout.status !== "rejected");
  const requestedAmount = committedPayouts.reduce((total, payout) => total + payout.amount, 0);
  const paidAmount = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((total, payout) => total + payout.amount, 0);

  return {
    grossEarnings,
    vatIncluded: vatRegistered ? Math.round((grossEarnings * 0.15 / 1.15) * 100) / 100 : 0,
    netSalesExcludingVat: vatRegistered ? Math.round((grossEarnings / 1.15) * 100) / 100 : grossEarnings,
    vatRegistered,
    requestedAmount,
    paidAmount,
    availableAmount: Math.max(0, grossEarnings - requestedAmount),
    payouts,
  };
}
