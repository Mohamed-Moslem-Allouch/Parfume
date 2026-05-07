"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ORDER_STATUSES, humanizeStatus } from "@/lib/status";

const statusOptions = ["ALL", ...ORDER_STATUSES] as const;

export function OrderStatusFilter({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    router.push(`/admin/orders${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <label className="block w-full sm:w-64">
      <span className="sr-only">Filter order status</span>
      <select value={value || "ALL"} onChange={(event) => updateStatus(event.target.value)} className="input-field">
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status === "ALL" ? "All statuses" : humanizeStatus(status)}
          </option>
        ))}
      </select>
    </label>
  );
}
