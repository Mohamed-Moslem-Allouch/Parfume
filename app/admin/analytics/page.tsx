import Link from "next/link";
import { Activity, ArrowRight, Eye, MousePointer2, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams: Promise<{ period?: string }>;
};

function periodToDays(period?: string) {
  const days = Number(period || "30");
  return [7, 30, 90].includes(days) ? days : 30;
}

export default async function PageAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const days = periodToDays(params.period);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const activeSince = new Date(Date.now() - 2 * 60 * 1000);

  const [views, activeVisitors] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5000
    }),
    prisma.visitorSession.count({ where: { lastSeenAt: { gte: activeSince } } })
  ]);

  const pageMap = new Map<string, { path: string; title: string; views: number; visitors: Set<string>; lastSeenAt: Date }>();

  for (const view of views) {
    const current = pageMap.get(view.path) || {
      path: view.path,
      title: view.title || view.path,
      views: 0,
      visitors: new Set<string>(),
      lastSeenAt: view.createdAt
    };
    current.views += 1;
    current.visitors.add(view.visitorId);
    if (view.createdAt > current.lastSeenAt) current.lastSeenAt = view.createdAt;
    pageMap.set(view.path, current);
  }

  const pages = Array.from(pageMap.values())
    .map((page) => ({ ...page, uniqueVisitors: page.visitors.size }))
    .sort((a, b) => b.views - a.views);
  const uniqueVisitors = new Set(views.map((view) => view.visitorId)).size;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Page analytics</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Business performance</h1>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((option) => (
            <Link key={option} href={`/admin/analytics?period=${option}`} className={option === days ? "btn-primary px-4 py-2" : "btn-secondary px-4 py-2"}>
              {option}d
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Page views", value: views.length, icon: Eye },
          { label: "Unique visitors", value: uniqueVisitors, icon: Users },
          { label: "Live visitors", value: activeVisitors, icon: Activity },
          { label: "Tracked pages", value: pages.length, icon: MousePointer2 }
        ].map((metric) => (
          <section key={metric.label} className="rounded-md border border-white/10 bg-obsidian p-5">
            <metric.icon className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm text-muted">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold text-mist">{metric.value}</p>
          </section>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-md border border-white/10 bg-obsidian">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-heading text-2xl text-mist">Top-performing pages</h2>
          </div>
          <div className="divide-y divide-white/10">
            {pages.slice(0, 8).map((page, index) => (
              <article key={page.path} className="grid gap-3 p-5 sm:grid-cols-[36px_1fr_auto] sm:items-center">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-sm font-bold text-gold">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-mist">{page.title}</p>
                  <p className="truncate text-xs text-muted">{page.path}</p>
                </div>
                <div className="text-sm text-muted sm:text-right">
                  <p><strong className="text-gold">{page.views}</strong> views</p>
                  <p>{page.uniqueVisitors} visitors</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-white/10 bg-obsidian">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-heading text-2xl text-mist">Most visited this period</h2>
          </div>
          <div className="divide-y divide-white/10">
            {pages.slice(0, 8).map((page) => (
              <article key={page.path} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-mist">{page.path}</p>
                  <p className="text-xs text-muted">Last view {formatDate(page.lastSeenAt)}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gold" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
