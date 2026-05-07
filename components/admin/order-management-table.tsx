"use client";

import Link from "next/link";
import { Download, Mail, Package, ReceiptText, RefreshCw, Square, SquareCheckBig } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SerializedOrder } from "@/lib/mappers";
import { ORDER_STATUSES, PAYMENT_STATUSES, humanizeStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function orderProducts(order: SerializedOrder) {
  return order.items.map((item) => `${item.productName}${item.variantName ? ` (${item.variantName})` : ""} x${item.quantity}`).join("; ");
}

export function OrderManagementTable({
  orders,
  compact = false
}: {
  orders: SerializedOrder[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPaymentStatus, setBulkPaymentStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.id)),
    [orders, selectedIds]
  );
  const exportOrders = selectedOrders.length ? selectedOrders : orders;
  const allSelected = orders.length > 0 && selectedIds.length === orders.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : orders.map((order) => order.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function updateRow(orderId: string, patch: { status?: string; paymentStatus?: string }) {
    setRowSavingId(orderId);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    setRowSavingId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  async function applyBulkAction() {
    if (!selectedIds.length || (!bulkStatus && !bulkPaymentStatus)) return;

    setSaving(true);
    const response = await fetch("/api/orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderIds: selectedIds,
        ...(bulkStatus ? { status: bulkStatus } : {}),
        ...(bulkPaymentStatus ? { paymentStatus: bulkPaymentStatus } : {})
      })
    });
    setSaving(false);

    if (response.ok) {
      setBulkStatus("");
      setBulkPaymentStatus("");
      setSelectedIds([]);
      router.refresh();
    }
  }

  function exportCsv() {
    const rows = [
      ["Order", "Date", "Customer", "Email", "Phone", "Products", "Delivery", "Payment", "Status", "Subtotal", "Delivery Fee", "Total"],
      ...exportOrders.map((order) => [
        order.orderNumber,
        formatDate(order.createdAt),
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        orderProducts(order),
        order.deliveryMethod === "HOME_DELIVERY" ? "Home delivery" : "Store pickup",
        humanizeStatus(order.paymentStatus),
        humanizeStatus(order.status),
        order.subtotal,
        order.deliveryFee,
        order.total
      ])
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-md border border-white/10 bg-obsidian">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <button type="button" onClick={toggleAll} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 font-medium text-mist hover:border-gold/45">
            {allSelected ? <SquareCheckBig className="h-4 w-4 text-gold" /> : <Square className="h-4 w-4" />}
            {allSelected ? "Clear selection" : "Select all"}
          </button>
          <span>
            <strong className="text-mist">{selectedIds.length}</strong> selected from <strong className="text-mist">{orders.length}</strong> orders
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} className="input-field h-11 py-2">
            <option value="">Bulk status</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{humanizeStatus(status)}</option>
            ))}
          </select>
          <select value={bulkPaymentStatus} onChange={(event) => setBulkPaymentStatus(event.target.value)} className="input-field h-11 py-2">
            <option value="">Bulk payment</option>
            {PAYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>{humanizeStatus(status)}</option>
            ))}
          </select>
          <button type="button" onClick={applyBulkAction} disabled={!selectedIds.length || saving || (!bulkStatus && !bulkPaymentStatus)} className="btn-secondary h-11 px-4 py-2">
            <RefreshCw className={cn("h-4 w-4", saving && "animate-spin")} />
            Apply
          </button>
          <button type="button" onClick={exportCsv} className="btn-primary h-11 px-4 py-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={cn("w-full border-collapse", compact ? "min-w-[980px]" : "min-w-[1120px]")}>
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-muted">
            <tr>
              <th className="px-4 py-4 text-left font-bold">Select</th>
              <th className="px-4 py-4 text-left font-bold">Order</th>
              <th className="px-4 py-4 text-left font-bold">Customer</th>
              <th className="px-4 py-4 text-left font-bold">Products</th>
              {!compact ? <th className="px-4 py-4 text-left font-bold">Delivery</th> : null}
              <th className="px-4 py-4 text-left font-bold">Payment</th>
              <th className="px-4 py-4 text-left font-bold">Status</th>
              <th className="px-4 py-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => {
              const checked = selectedIds.includes(order.id);
              const products = order.items.slice(0, compact ? 2 : 3);

              return (
                <tr key={order.id} className={cn("transition-colors hover:bg-white/[0.03]", checked && "bg-gold/10")}>
                  <td className="px-4 py-4">
                    <label className="inline-flex cursor-pointer items-center">
                      <input type="checkbox" checked={checked} onChange={() => toggleOne(order.id)} className="sr-only" />
                      {checked ? <SquareCheckBig className="h-5 w-5 text-gold" /> : <Square className="h-5 w-5 text-muted" />}
                    </label>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="font-bold text-gold">{order.orderNumber}</Link>
                    <p className="mt-1 text-xs text-muted">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-mist">{order.customerName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Mail className="h-3 w-3" /> {order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid gap-1.5">
                      {products.map((item) => (
                        <p key={item.id} className="flex items-start gap-2 text-sm text-mist">
                          <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                          <span>
                            {item.productName}
                            {item.variantName ? <span className="text-muted"> ({item.variantName})</span> : null}
                            <span className="text-gold"> x{item.quantity}</span>
                          </span>
                        </p>
                      ))}
                      {order.items.length > products.length ? <p className="text-xs text-muted">+{order.items.length - products.length} more item(s)</p> : null}
                    </div>
                  </td>
                  {!compact ? (
                    <td className="px-4 py-4 text-sm text-muted">
                      {order.deliveryMethod === "HOME_DELIVERY" ? "Home delivery" : "Store pickup"}
                    </td>
                  ) : null}
                  <td className="px-4 py-4">
                    <div className="grid gap-2">
                      <StatusBadge value={order.paymentStatus} type="payment" />
                      {!compact ? (
                        <select
                          value={order.paymentStatus}
                          disabled={rowSavingId === order.id}
                          onChange={(event) => updateRow(order.id, { status: order.status, paymentStatus: event.target.value })}
                          className="input-field h-9 rounded-lg px-3 py-1 text-xs"
                        >
                          {PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>{humanizeStatus(status)}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid gap-2">
                      <StatusBadge value={order.status} />
                      {!compact ? (
                        <select
                          value={order.status}
                          disabled={rowSavingId === order.id}
                          onChange={(event) => updateRow(order.id, { status: event.target.value })}
                          className="input-field h-9 rounded-lg px-3 py-1 text-xs"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>{humanizeStatus(status)}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-2 font-bold text-gold">
                      <ReceiptText className="h-4 w-4" />
                      {formatCurrency(order.total)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!orders.length ? (
        <div className="px-6 py-16 text-center">
          <p className="font-heading text-2xl text-mist">No orders found</p>
          <p className="mt-2 text-sm text-muted">New customer orders will appear here.</p>
        </div>
      ) : null}
    </section>
  );
}
