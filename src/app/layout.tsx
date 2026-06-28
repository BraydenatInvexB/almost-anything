import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { AppProviders } from "@/context/AppProviders";
import { VisitTracker } from "@/components/analytics/VisitTracker";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} | The Store for Almost Anything`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: ["online store", "e-commerce", "shopping", "product finder", "best price", "almost anything"],
  icons: {
    icon: SITE_CONFIG.logo,
    apple: SITE_CONFIG.logo,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="font-sans antialiased">
        <AppProviders>
          <VisitTracker />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
