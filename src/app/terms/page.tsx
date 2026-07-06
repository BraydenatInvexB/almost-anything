import { LegalPage } from "@/components/legal/LegalPage";
import { PAYMENT_GATEWAY_FEES_LEGAL } from "@/config/payment-gateway-fees";
import { SITE_CONFIG } from "@/config/site";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="July 6, 2026"
      sections={[
        {
          heading: "Acceptance",
          text: `By using ${SITE_CONFIG.name}, you agree to these terms. If you do not agree, please do not use our services.`,
        },
        {
          heading: "Products & availability",
          text: "We aim to keep pricing and availability accurate at all times. Prices and availability may change, and in rare cases an item may become unavailable after you order, in which case you'll be offered an alternative or a full refund.",
        },
        {
          heading: "Delivery & shipping",
          text: "Delivery fees may apply at checkout unless a product price already includes delivery or a free-shipping promotion is active. Available courier partners and delivery estimates are shown during checkout. Shipping costs depend on platform settings and the courier selected for your order.",
        },
        {
          heading: "Payments",
          text: `All prices are in South African Rand (ZAR) unless stated otherwise. Payment is collected at checkout through our payment partner, Paystack. We begin processing your order once payment is confirmed. ${PAYMENT_GATEWAY_FEES_LEGAL}`,
        },
        {
          heading: "Marketplace sellers",
          text: "Third-party sellers on our marketplace receive payouts after orders are fulfilled. Seller payouts are subject to the same Paystack card processing fees listed above. No additional platform payment fees apply beyond those gateway charges unless separately agreed in writing.",
        },
        {
          heading: "Contact",
          text: `Questions about these terms? Email ${SITE_CONFIG.supportEmail}.`,
        },
      ]}
    />
  );
}
