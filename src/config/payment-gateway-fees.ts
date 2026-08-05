export interface PaymentGatewayFee {
  label: string;
  rate: string;
}

export interface PaymentGatewayPricing {
  id: "payfast" | "ozow";
  name: string;
  summary: string;
  fees: PaymentGatewayFee[];
  note: string;
  pricingUrl: string;
}

export const PAYMENT_GATEWAYS: PaymentGatewayPricing[] = [
  {
    id: "payfast",
    name: "PayFast",
    summary: "Published Aggregation rates",
    fees: [
      { label: "Credit and cheque cards", rate: "3.2% + R2.00" },
      { label: "Instant EFT and Capitec Pay", rate: "2.0% (minimum R2.00)" },
      { label: "Standard payout", rate: "R8.70" },
      { label: "Immediate payout", rate: "0.8% (minimum R14.00)" },
    ],
    note: "PayFast publishes these fees excluding VAT. Custom pricing may apply to qualifying transaction volumes.",
    pricingUrl: "https://payfast.io/fees/",
  },
  {
    id: "ozow",
    name: "Ozow",
    summary: "Published Standard package rates",
    fees: [
      { label: "Pay by Bank and supported bank payments", rate: "1.5% (minimum R1.00)" },
      { label: "Local cards up to R249,999.99", rate: "2.85% (minimum R1.00)" },
      { label: "Local cards from R250,000 to R499,999.99", rate: "2.75% (minimum R1.00)" },
      { label: "Local cards from R500,000 to R1,000,000", rate: "2.65% (minimum R1.00)" },
      { label: "International cards", rate: "3.5% (minimum R1.00)" },
      { label: "Instant or bulk payout", rate: "R3.00" },
    ],
    note: "Enterprise pricing is tailored for merchants processing more than R1.5 million per month.",
    pricingUrl: "https://ozow.com/pricing",
  },
];

export const PAYMENT_GATEWAY_FEES_LEGAL =
  "Payments are processed securely through PayFast or Ozow. Processing fees depend on the payment method, monthly processing volume, VAT treatment and any custom merchant agreement. Applicable charges are accounted for before seller funds become available for withdrawal.";
