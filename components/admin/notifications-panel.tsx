"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationsPanel({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    router.refresh();
  }

  return (
    <section className="rounded-md border border-white/10 bg-obsidian">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-gold" />
          <h2 className="font-heading text-2xl text-mist">Latest alerts</h2>
        </div>
        <button type="button" onClick={markAllRead} className="btn-secondary px-4 py-2">
          <CheckCheck className="h-4 w-4" />
          Mark read
        </button>
      </div>
      <div className="divide-y divide-white/10">
        {notifications.map((notification) => {
          const content = (
            <article className={cn("grid gap-2 p-5 transition hover:bg-white/[0.03]", !notification.read && "bg-gold/10")}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{notification.type}</p>
                  <h3 className="mt-1 font-heading text-xl text-mist">{notification.title}</h3>
                </div>
                <p className="text-xs text-muted">{formatDate(notification.createdAt)}</p>
              </div>
              <p className="text-sm leading-6 text-muted">{notification.message}</p>
            </article>
          );

          return notification.href ? (
            <Link key={notification.id} href={notification.href}>
              {content}
            </Link>
          ) : (
            <div key={notification.id}>{content}</div>
          );
        })}
      </div>
      {!notifications.length ? (
        <div className="px-6 py-16 text-center">
          <p className="font-heading text-2xl text-mist">No notifications yet</p>
          <p className="mt-2 text-sm text-muted">Order, inventory, inbox, and system alerts will show here.</p>
        </div>
      ) : null}
    </section>
  );
}
