"use client";

import Link from "next/link";
import { BarChart3, LayoutDashboard, PackagePlus, ReceiptText, Settings } from "lucide-react";
import { useEffect, useState } from "react";

const shortcutOptions = [
  { key: "newProduct", label: "New product", href: "/admin/products/new", icon: PackagePlus },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: ReceiptText },
  { key: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", href: "/admin/settings", icon: Settings }
];

export function DashboardPersonalizer() {
  const [enabled, setEnabled] = useState<string[]>(shortcutOptions.map((item) => item.key));

  useEffect(() => {
    const saved = window.localStorage.getItem("admin-dashboard-shortcuts");
    if (saved) {
      setEnabled(JSON.parse(saved));
    }
  }, []);

  function toggle(key: string) {
    setEnabled((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      window.localStorage.setItem("admin-dashboard-shortcuts", JSON.stringify(next));
      return next;
    });
  }

  return (
    <section className="mt-5 rounded-md border border-white/10 bg-obsidian p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-gold" />
            <h2 className="font-heading text-2xl text-mist">My dashboard</h2>
          </div>
          <p className="mt-2 text-sm text-muted">Choose the shortcuts you want within reach.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {shortcutOptions.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className={enabled.includes(item.key) ? "btn-primary px-4 py-2" : "btn-secondary px-4 py-2"}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {shortcutOptions.filter((item) => enabled.includes(item.key)).map((item) => (
          <Link key={item.key} href={item.href} className="flex items-center gap-3 rounded-md border border-white/10 bg-midnight p-4 transition hover:border-gold/45">
            <item.icon className="h-5 w-5 text-gold" />
            <span className="font-medium text-mist">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
