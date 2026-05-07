import { humanizeStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

const orderTone: Record<string, string> = {
  PENDING: "border-amber-500/35 bg-amber-500/12 text-amber-300",
  PROCESSING: "border-sky-500/35 bg-sky-500/12 text-sky-300",
  SHIPPED: "border-indigo-500/35 bg-indigo-500/12 text-indigo-300",
  DELIVERED: "border-emerald-500/35 bg-emerald-500/12 text-emerald-300",
  COMPLETED: "border-emerald-500/45 bg-emerald-500/15 text-emerald-300",
  CANCELED: "border-red-500/40 bg-red-500/12 text-red-300"
};

const paymentTone: Record<string, string> = {
  UNPAID: "border-amber-500/35 bg-amber-500/12 text-amber-300",
  PAID: "border-emerald-500/45 bg-emerald-500/15 text-emerald-300",
  REFUNDED: "border-violet-500/35 bg-violet-500/12 text-violet-300",
  CANCELED: "border-red-500/40 bg-red-500/12 text-red-300"
};

const productTone: Record<string, string> = {
  ACTIVE: "border-emerald-500/45 bg-emerald-500/15 text-emerald-300",
  DRAFT: "border-amber-500/35 bg-amber-500/12 text-amber-300",
  ARCHIVED: "border-zinc-500/35 bg-zinc-500/12 text-zinc-300"
};

export function StatusBadge({
  value,
  type = "order",
  className
}: {
  value: string;
  type?: "order" | "payment" | "product";
  className?: string;
}) {
  const tones = type === "payment" ? paymentTone : type === "product" ? productTone : orderTone;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        tones[value] || "border-white/15 bg-white/5 text-muted",
        className
      )}
    >
      {humanizeStatus(value)}
    </span>
  );
}
