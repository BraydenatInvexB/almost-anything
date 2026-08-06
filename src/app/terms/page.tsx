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
          text: "Delivery fees may apply at checkout unless a product price already includes delivery or a free-shipping promotion is active. Almost Anything coordinates order collection and customer delivery. The applicable delivery fee and estimate are shown during checkout.",
        },
        {
          heading: "Payments",
          text: `All prices are in South African Rand (ZAR) unless stated otherwise. Payment is collected at checkout through PayFast or Ozow. We begin processing your order once payment is confirmed. ${PAYMENT_GATEWAY_FEES_LEGAL}`,
        },
        {
          heading: "Marketplace sellers",
          text: "Third-party sellers receive payouts after eligible orders are fulfilled. Payment processing charges are accounted for before funds become available for withdrawal. Any additional charges must be agreed separately in writing.",
        },
        {
          heading: "Contact",
          text: `Questions about these terms? Email ${SITE_CONFIG.supportEmail}.`,
        },
      ]}
    />
  );
}
