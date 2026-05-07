import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { GoogleTranslateWidget } from "@/components/google-translate-widget";
import { AppProviders } from "@/components/providers/app-providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer } from "@/components/cart-drawer";
import { HeroParticles } from "@/components/hero-particles";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

export const metadata: Metadata = {
  applicationName: "Sary Parfume",
  appleWebApp: {
    capable: true,
    title: "Sary Parfume",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: true
  },
  title: {
    default: "Sary Parfume | Beauty & Fragrance Store",
    template: "%s | Sary Parfume"
  },
  description: "Premium perfumes, body care, oils, and beauty products. Shop online with store pickup or home delivery.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#080808"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} bg-[var(--background)] font-body text-[var(--foreground)] antialiased`} suppressHydrationWarning>
        <AppProviders>
          <div className="no-print fixed inset-0 pointer-events-none z-0">
            <HeroParticles />
          </div>
          <Header />
          <main className="relative z-10 min-h-screen pt-16 sm:pt-20">{children}</main>
          <Footer />
          <CartDrawer />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <GoogleTranslateWidget />
        </AppProviders>
      </body>
    </html>
  );
}
