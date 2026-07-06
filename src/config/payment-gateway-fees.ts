/** Paystack card processing fees — the only payment gateway charges on the platform. */
export const PAYSTACK_LOCAL_CARD_FEE = { percent: 2.9, flatZar: 1 } as const;
export const PAYSTACK_INTERNATIONAL_CARD_FEE = { percent: 3.9, flatZar: 1 } as const;

export type PaymentGatewayFeeTier = {
  id: "local" | "international";
  label: string;
  percent: number;
  flatZar: number;
};

export const PAYMENT_GATEWAY_FEE_TIERS: PaymentGatewayFeeTier[] = [
  {
    id: "local",
    label: "Local cards (Visa, Mastercard, Amex)",
    percent: PAYSTACK_LOCAL_CARD_FEE.percent,
    flatZar: PAYSTACK_LOCAL_CARD_FEE.flatZar,
  },
  {
    id: "international",
    label: "International cards",
    percent: PAYSTACK_INTERNATIONAL_CARD_FEE.percent,
    flatZar: PAYSTACK_INTERNATIONAL_CARD_FEE.flatZar,
  },
];

export function formatGatewayFeeTier(tier: Pick<PaymentGatewayFeeTier, "percent" | "flatZar">): string {
  return `${tier.percent}% + R${tier.flatZar.toFixed(2)} per transaction`;
}

export function estimateGatewayFee(amountZar: number, international = false): number {
  const tier = international ? PAYSTACK_INTERNATIONAL_CARD_FEE : PAYSTACK_LOCAL_CARD_FEE;
  return Math.round((amountZar * (tier.percent / 100) + tier.flatZar) * 100) / 100;
}

export const PAYMENT_GATEWAY_FEES_LEGAL =
  "Card payments are processed by Paystack. The only payment processing fees are 2.9% + R1.00 per transaction for local cards (Visa, Mastercard, Amex) and 3.9% + R1.00 per transaction for international cards. These fees are deducted by the payment gateway before settlement.";
