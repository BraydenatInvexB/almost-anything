import { LegalPage } from "@/components/legal/LegalPage";
import { SITE_CONFIG } from "@/config/site";

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      lastUpdated="June 30, 2026"
      sections={[
        {
          heading: "What are cookies?",
          text: "Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you signed in, and understand how the store is used.",
        },
        {
          heading: "Cookies we use",
          text: "We use essential cookies for checkout, account login, and cart functionality. We may also use analytics cookies to improve search and product discovery. Marketing cookies are only set if you opt in.",
        },
        {
          heading: "Managing cookies",
          text: "You can block or delete cookies in your browser settings. Disabling essential cookies may prevent checkout, sign-in, or cart features from working correctly.",
        },
        {
          heading: "Contact",
          text: `Questions about cookies? Email ${SITE_CONFIG.supportEmail}.`,
        },
      ]}
    />
  );
}
