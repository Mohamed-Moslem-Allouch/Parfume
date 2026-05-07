"use client";

import { FileText, Printer } from "lucide-react";
import { storeConfig } from "@/lib/store";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";

type InvoiceItem = {
  id: string;
  productName: string;
  variantName: string | null;
  productPrice: { toString: () => string } | number;
  quantity: number;
};

type InvoiceOrder = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  address: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
  subtotal: { toString: () => string } | number;
  deliveryFee: { toString: () => string } | number;
  total: { toString: () => string } | number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string | null;
  createdAt: Date | string;
  items: InvoiceItem[];
};

export function InvoiceView({ order }: { order: InvoiceOrder }) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="grid gap-4">
      <style jsx global>{`
        @media print {
          /* Hide browser headers/footers */
          @page { 
            size: A4;
            margin: 8mm !important; 
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide ALL navigation, headers, footers, buttons */
          header, footer, nav, aside, .no-print, button, canvas,
          [role="navigation"], [role="banner"],
          .admin-sidebar, .admin-header,
          .lucide, svg, img:not(.invoice-logo), .sign-out-btn {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Ensure the invoice is the only thing visible */
          .invoice-container {
            display: block !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
          }

          .invoice-header {
            background: #fafafa !important;
            border-bottom: 2px solid #000 !important;
            padding: 12px 0 !important;
          }

          .invoice-container table {
            font-size: 11px !important;
          }

          .invoice-container td,
          .invoice-container th {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }

          .invoice-compact {
            padding: 12px 0 !important;
          }

          .invoice-total {
            padding: 8px 10px !important;
          }

          /* Color overrides for print */
          .text-gold { color: #856404 !important; }
          .text-mist, .text-muted { color: #000 !important; }
          .border-white\/10 { border-color: #ddd !important; }
          .bg-gold\/15, .bg-gold\/10 { background: #fdfdfd !important; border: 1px solid #ccc !important; }
          .bg-charcoal, .bg-obsidian { background: white !important; }
          
          /* Ensure text is visible */
          .invoice-container * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: black !important;
          }

          .invoice-container .text-gold,
          .invoice-container .font-heading {
            color: #856404 !important;
          }
          
          .font-heading {
            font-family: serif !important;
          }
        }
      `}</style>

      <div className="flex gap-3 no-print">
        <button type="button" onClick={handlePrint} className="btn-primary">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="invoice-container overflow-hidden rounded-lg border border-white/10 bg-obsidian">
        {/* Header */}
        <div className="invoice-header border-b border-white/10 bg-charcoal p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <h2 className="font-heading text-3xl font-bold text-gold sm:text-4xl">{storeConfig.name}</h2>
              <p className="mt-2 text-sm text-muted">{storeConfig.address}</p>
              <p className="text-sm text-muted">{storeConfig.phone}</p>
              <p className="text-sm text-muted">{storeConfig.email}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Invoice</p>
              <p className="mt-2 font-heading text-2xl font-bold text-mist">{order.orderNumber}</p>
              <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt)}</p>
              <div className="mt-3">
                <span className="rounded-md bg-gold/15 px-3 py-1 text-xs font-bold text-gold uppercase tracking-widest">
                  {order.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Delivery */}
        <div className="invoice-compact grid gap-8 border-b border-white/10 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold border-b border-gold/20 pb-2">Bill To</p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Full Name:</p>
                <p className="font-bold text-mist text-base">{order.customerName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Email:</p>
                <p className="text-mist">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Phone Number:</p>
                <p className="text-mist">{order.customerPhone}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold border-b border-gold/20 pb-2">Delivery Details</p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Payment:</p>
                <p className="font-bold text-mist">{(order.paymentStatus || "UNPAID").replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Method:</p>
                <p className="font-bold text-mist">
                  {order.deliveryMethod === "HOME_DELIVERY" ? "Home Delivery" : "Store Pickup"}
                </p>
              </div>
              
              {order.deliveryMethod === "HOME_DELIVERY" ? (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Address:</p>
                    <p className="text-mist leading-relaxed">{order.address || "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">City:</p>
                      <p className="text-mist">{order.city || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Code Postal:</p>
                      <p className="text-mist">{order.zip || "N/A"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted mb-1">Pickup Location:</p>
                  <p className="text-mist leading-relaxed font-bold">{storeConfig.address}</p>
                </div>
              )}

              {order.notes && (
                <div className="rounded-md bg-white/5 p-3 border border-white/10 mt-2">
                  <p className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Additional Note:</p>
                  <p className="italic text-muted leading-relaxed">&quot;{order.notes}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="invoice-compact p-6 sm:p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-gold">
                <th className="pb-3 text-left font-medium">Item Description</th>
                <th className="pb-3 text-center font-medium">Qty</th>
                <th className="pb-3 text-right font-medium">Unit Price</th>
                <th className="pb-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {order.items.map((item) => {
                const price = toNumber(item.productPrice);
                const lineTotal = price * item.quantity;
                return (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-mist">{item.productName}</p>
                      {item.variantName && item.variantName !== "Standard" && (
                        <p className="mt-0.5 text-xs text-gold font-medium uppercase tracking-wider">{item.variantName}</p>
                      )}
                    </td>
                    <td className="py-4 text-center text-mist">{item.quantity}</td>
                    <td className="py-4 text-right text-muted">{formatCurrency(price)}</td>
                    <td className="py-4 text-right font-bold text-mist">{formatCurrency(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium text-mist">{formatCurrency(toNumber(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery Fee</span>
                <span className="font-medium text-mist">{formatCurrency(toNumber(order.deliveryFee))}</span>
              </div>
              <div className="invoice-total flex justify-between rounded-lg bg-gold/10 p-4 text-lg font-bold border border-gold/20">
                <span className="text-gold uppercase tracking-tighter">Amount Due</span>
                <span className="text-gold">{formatCurrency(toNumber(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 border-t border-white/10 pt-8 text-center">
            <p className="text-sm font-heading text-mist">Thank you for choosing {storeConfig.name}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted">
              {storeConfig.name} &bull; {storeConfig.email} &bull; {storeConfig.phone}
            </p>
            <div className="mt-4 flex justify-center">
               <div className="h-1 w-20 bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
