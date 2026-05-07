"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { VisualMenuDropdown } from "@/components/visual-menu-dropdown";
import { useCart } from "@/components/providers/cart-provider";
import type { PublicMenuItem } from "@/lib/menu";
import { cn } from "@/lib/utils";

export function HeaderClient({ menuItems, visualCategories }: { menuItems: PublicMenuItem[]; visualCategories: any[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header style={{ backgroundColor: "var(--surface-solid)", borderBottomColor: "var(--border)" }} className="no-print fixed inset-x-0 top-0 z-[70] border-b backdrop-blur-xl" suppressHydrationWarning>
      <div className="section-shell relative flex h-20 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-4 lg:flex" aria-label="Main menu">
          <VisualMenuDropdown categories={visualCategories} />
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "max-w-40 truncate rounded-md px-5 py-3 text-base font-bold text-muted transition hover:bg-white/5 hover:text-mist",
                (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) && "bg-white/5 text-gold"
              )}
              title={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button
            type="button"
            onClick={openCart}
            className="relative flex h-12 w-12 touch-manipulation items-center justify-center rounded-md border-2 border-white/10 text-mist transition hover:border-gold hover:text-gold"
            aria-label="Open cart"
            title="Open cart"
          >
            <ShoppingBag className="h-6 w-6" />
            {itemCount > 0 ? (
              <span className="absolute -right-2 -top-2 grid h-7 min-w-7 place-items-center rounded-full bg-gold px-1 text-sm font-bold text-midnight">
                {itemCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-12 w-12 touch-manipulation items-center justify-center rounded-md border-2 border-white/10 text-mist lg:hidden"
            aria-label="Toggle menu"
            title="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-7 w-7 text-gold" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ backgroundColor: "var(--surface-solid)", borderColor: "var(--border)" }}
              className="no-scrollbar absolute right-4 top-[88px] max-h-[80vh] w-80 overflow-y-auto rounded-2xl border p-4 shadow-2xl lg:hidden"
            >
              <nav className="flex flex-col gap-1" aria-label="Mobile menu">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-4 py-3 text-sm font-bold text-muted transition hover:bg-white/5 hover:text-gold",
                      (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) && "bg-white/5 text-gold"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="my-4 h-0.5 bg-white/20" />

                <div className="px-2 pb-2">
                  <VisualMenuDropdown categories={visualCategories} isMobileMenu />
                </div>

                <div className="flex w-full items-center gap-3 rounded-lg px-4 py-3">
                  <ThemeToggle />
                  <span className="text-xs font-bold text-muted">Toggle Theme</span>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
