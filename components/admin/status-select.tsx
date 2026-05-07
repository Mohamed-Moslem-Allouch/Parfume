"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUSES, humanizeStatus } from "@/lib/status";

export function StatusSelect({ orderId, value }: { orderId: string; value: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(value);
  const [saving, setSaving] = useState(false);

  async function updateStatus(nextStatus: string) {
    setStatus(nextStatus);
    setSaving(true);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: nextStatus })
    });

    setSaving(false);

    if (!response.ok) {
      setStatus(value);
      return;
    }

    router.refresh();
  }

  return (
    <label className="block">
      <span className="sr-only">Order status</span>
      <select value={status} onChange={(event) => updateStatus(event.target.value)} className="input-field" disabled={saving}>
        {ORDER_STATUSES.map((item) => (
          <option key={item} value={item}>
            {humanizeStatus(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
