"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Bell,
  FileText,
  FolderTree,
  Home,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  X
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

type Counts = {
  orders: number;
  inbox: number;
  email: number;
  facebook: number;
  instagram: number;
  notifications: number;
};

const navGroups = [
  {
    label: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", icon: BarChart3 },
      { href: "/admin/analytics", label: "Page Analytics", icon: BarChart3 },
      { href: "/admin/ecommerce", label: "E-Commerce", icon: ShoppingCart }
    ]
  },
  {
    label: "Operations",
    links: [
      { href: "/admin/orders", label: "Orders", icon: ReceiptText, countKey: "orders" },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inbox", label: "Inbox", icon: Inbox, countKey: "inbox" },
      { href: "/admin/notifications", label: "Notifications", icon: Bell, countKey: "notifications" }
    ]
  },
  {
    label: "Content",
    links: [
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/collections", label: "Collections", icon: LayoutGrid },
      { href: "/admin/pages", label: "Pages", icon: FileText },
      { href: "/admin/menu", label: "Menu", icon: MenuIcon }
    ]
  },
  {
    label: "System",
    links: [
      { href: "/admin/settings", label: "Settings", icon: Settings }
    ]
  }
];

export function AdminNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ orders: 0, inbox: 0, email: 0, facebook: 0, instagram: 0, notifications: 0 });

  useEffect(() => {
    let mounted = true;

    async function loadCounts() {
      const response = await fetch("/api/admin/counts", { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as Counts;
      if (mounted) setCounts(next);
    }

    loadCounts();
    const interval = window.setInterval(loadCounts, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <aside className="no-print sticky top-0 z-[60] border-b border-white/10 bg-black/40 backdrop-blur-xl lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4 p-5 lg:block">
        <Logo isAdmin />
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-muted hover:text-mist"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-muted hover:text-mist"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className={cn("flex-col gap-5 px-4 pb-5 lg:flex", isOpen ? "flex animate-in slide-in-from-top-4 duration-300" : "hidden lg:flex")}>
        {navGroups.map((group) => (
          <div key={group.label} className="grid gap-1">
            <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted">{group.label}</p>
            {group.links.map((link) => {
              const count = link.countKey ? counts[link.countKey as keyof Counts] || 0 : 0;
              const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-mist",
                    active && "bg-gold/10 text-gold"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {count > 0 ? (
                    <span className="admin-count-badge grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black">
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-mist"
        >
          <Home className="h-4 w-4" />
          Storefront
        </Link>
      </nav>

      <div className="hidden px-4 pb-5 lg:block">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="no-print flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-mist"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
