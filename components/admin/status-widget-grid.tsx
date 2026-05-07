import { CheckCircle2, Clock3, CreditCard, PackageCheck, RotateCcw, Truck, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { humanizeStatus } from "@/lib/status";

const orderIconMap: Record<string, any> = {
  PENDING: Clock3,
  PROCESSING: RotateCcw,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  COMPLETED: CheckCircle2,
  CANCELED: XCircle
};

const paymentIconMap: Record<string, any> = {
  UNPAID: Clock3,
  PAID: CreditCard,
  REFUNDED: RotateCcw,
  CANCELED: XCircle
};

export function StatusWidgetGrid({
  title,
  items,
  type = "order"
}: {
  title: string;
  items: { status: string; count: number }[];
  type?: "order" | "payment";
}) {
  const iconMap = type === "payment" ? paymentIconMap : orderIconMap;
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-md border border-white/10 bg-obsidian p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl text-mist">{title}</h2>
        <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-muted">{total} total</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = iconMap[item.status] || Clock3;
          const percent = total ? Math.round((item.count / total) * 100) : 0;

          return (
            <article key={item.status} className="rounded-md border border-white/10 bg-midnight p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/25 bg-gold/10 text-gold">
                  <Icon className="h-4 w-4" />
                </span>
                <StatusBadge value={item.status} type={type} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold text-mist">{item.count}</p>
                  <p className="mt-1 text-xs text-muted">{humanizeStatus(item.status)}</p>
                </div>
                <p className="text-sm font-bold text-gold">{percent}%</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
