"use client";

import { Activity } from "lucide-react";
import { useEffect, useState } from "react";

type LiveVisitorsResponse = {
  count: number;
  visitors: {
    visitorId: string;
    path: string;
    lastSeenAt: string;
  }[];
};

export function LiveVisitorsCard({ initialCount = 0 }: { initialCount?: number }) {
  const [data, setData] = useState<LiveVisitorsResponse>({ count: initialCount, visitors: [] });

  useEffect(() => {
    let mounted = true;

    async function load() {
      const response = await fetch("/api/analytics/live", { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as LiveVisitorsResponse;
      if (mounted) setData(next);
    }

    load();
    const interval = window.setInterval(load, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="rounded-md border border-white/10 bg-obsidian p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Live visitors</p>
          <p className="mt-2 text-3xl font-bold text-mist">{data.count}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <Activity className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {data.visitors.slice(0, 3).map((visitor) => (
          <div key={visitor.visitorId} className="truncate rounded-md border border-white/10 bg-midnight px-3 py-2 text-xs text-muted">
            {visitor.path}
          </div>
        ))}
        {!data.visitors.length ? <p className="text-xs text-muted">No active visitors in the last 2 minutes.</p> : null}
      </div>
    </section>
  );
}
