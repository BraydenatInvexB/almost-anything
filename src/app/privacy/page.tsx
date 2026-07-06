import { LegalPage } from "@/components/legal/LegalPage";
import { SITE_CONFIG } from "@/config/site";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="June 27, 2026"
      sections={[
        { heading: "Information we collect", text: "We collect information you provide at checkout (name, email, shipping address), account credentials, and browsing activity on our platform." },
        { heading: "How we use your data", text: "Your data is used to process orders, improve our service, send order updates, and (with consent) marketing communications." },
        { heading: "Third parties", text: "We share data with payment processors (Paystack), database hosting (Supabase), and shipping carriers only as needed to fulfill your order." },
        { heading: "Contact", text: `For privacy requests, contact ${SITE_CONFIG.supportEmail}.` },
      ]}
    />
  );
}
