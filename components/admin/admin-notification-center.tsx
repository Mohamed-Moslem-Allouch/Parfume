"use client";

import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

type NotificationsResponse = {
  unread: number;
  notifications: NotificationRow[];
};

export function AdminNotificationCenter() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<NotificationRow | null>(null);
  const [data, setData] = useState<NotificationsResponse>({ unread: 0, notifications: [] });
  const previousUnread = useRef(0);

  async function load() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as NotificationsResponse;

    if (previousUnread.current > 0 && next.unread > previousUnread.current) {
      const newest = next.notifications.find((notification) => !notification.read);
      if (newest) setToast(newest);
    }

    previousUnread.current = next.unread;
    setData(next);
  }

  async function markRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    await load();
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <div className="no-print sticky top-0 z-40 mb-5 flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-obsidian text-mist shadow-gold transition hover:border-gold/45 hover:text-gold"
            aria-label="Open notifications"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {data.unread > 0 ? (
              <span className="admin-count-badge absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black">
                {data.unread > 99 ? "99+" : data.unread}
              </span>
            ) : null}
          </button>
          {open ? (
            <div className="absolute right-0 top-13 w-[min(92vw,420px)] overflow-hidden rounded-md border border-white/10 bg-obsidian shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Notifications</p>
                  <p className="text-sm text-muted">{data.unread} unread alerts</p>
                </div>
                <button type="button" onClick={markRead} className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-white/5 hover:text-gold" title="Mark all read">
                  <CheckCheck className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[460px] overflow-y-auto">
                {data.notifications.slice(0, 10).map((notification) => {
                  const content = (
                    <article className={cn("grid gap-1 border-b border-white/10 p-4 transition hover:bg-white/[0.03]", !notification.read && "bg-gold/10")}>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{notification.type}</p>
                      <h3 className="font-semibold text-mist">{notification.title}</h3>
                      <p className="text-sm leading-6 text-muted">{notification.message}</p>
                      <p className="text-[11px] text-muted">{formatDate(notification.createdAt)}</p>
                    </article>
                  );

                  return notification.href ? (
                    <Link key={notification.id} href={notification.href} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })}
                {!data.notifications.length ? <p className="p-5 text-sm text-muted">No alerts yet.</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div className="no-print fixed bottom-5 right-5 z-[90] w-[min(92vw,360px)] rounded-md border border-gold/30 bg-obsidian p-4 shadow-gold">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{toast.type}</p>
              <h3 className="mt-1 font-semibold text-mist">{toast.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{toast.message}</p>
            </div>
            <button type="button" onClick={() => setToast(null)} className="text-muted hover:text-mist" aria-label="Close notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
