"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

const visitorKey = "sary-parfume-visitor-id";

function getVisitorId() {
  let id = window.localStorage.getItem(visitorKey);

  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(visitorKey, id);
  }

  return id;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const path = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;

    const visitorId = getVisitorId();
    const payload = {
      visitorId,
      path,
      title: document.title,
      referrer: document.referrer || null
    };

    navigator.sendBeacon?.("/api/analytics/track", new Blob([JSON.stringify({ ...payload, event: "view" })], { type: "application/json" })) ||
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, event: "view" }),
        keepalive: true
      });

    const interval = window.setInterval(() => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, event: "heartbeat" }),
        keepalive: true
      }).catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [path]);

  return null;
}
