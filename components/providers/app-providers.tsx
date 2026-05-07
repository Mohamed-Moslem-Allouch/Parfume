"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/providers/cart-provider";
import { AppearancePreferenceSync } from "@/components/providers/appearance-preference-sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppearancePreferenceSync>
          <CartProvider>{children}</CartProvider>
        </AppearancePreferenceSync>
      </ThemeProvider>
    </SessionProvider>
  );
}
