import nodemailer from "nodemailer";
import { formatCurrency, formatDate } from "@/lib/format";
import { storeConfig } from "@/lib/store";

type EmailOrder = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: "HOME_DELIVERY" | "STORE_PICKUP";
  address: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  items: {
    productName: string;
    variantName?: string | null;
    productPrice: number;
    quantity: number;
  }[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (match) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[match];
  });
}

export function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass || host.includes("example.com") || user === "smtp-user" || pass === "smtp-password") {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || "587");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

function renderOrderEmail(order: EmailOrder) {
  const deliveryRows =
    order.deliveryMethod === "HOME_DELIVERY"
      ? [
          ["Method", "Home delivery"],
          ["Customer", order.customerName],
          ["Phone", order.customerPhone],
          ["Email", order.customerEmail],
          ["Address", order.address || "Not provided"],
          ["City", order.city || "Not provided"],
          ["Postal code", order.zip || "Not provided"]
        ]
      : [
          ["Method", "Store pickup"],
          ["Customer", order.customerName],
          ["Phone", order.customerPhone],
          ["Email", order.customerEmail],
          ["Pickup address", storeConfig.address],
          ["Store phone", storeConfig.phone],
          ["Store email", storeConfig.email]
        ];

  const deliveryDetails = deliveryRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:7px 0;color:#9CA3AF;width:34%;">${escapeHtml(label)}</td>
          <td style="padding:7px 0;color:#f5f5f5;font-weight:600;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const items = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;">${escapeHtml(item.productName)}${item.variantName ? ` <span style="color:#9CA3AF;">(${escapeHtml(item.variantName)})</span>` : ""}</td>
          <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;color:#f5f5f5;text-align:right;">${formatCurrency(item.productPrice * item.quantity)}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="margin:0;background:#080808;padding:32px;font-family:Inter,Arial,sans-serif;color:#f5f5f5;">
      <div style="max-width:680px;margin:0 auto;border:1px solid rgba(212,175,55,.35);background:#111;padding:32px;">
        <div style="font-family:Georgia,serif;font-size:30px;color:#D4AF37;margin-bottom:10px;">${escapeHtml(storeConfig.name)}</div>
        <p style="color:#9CA3AF;margin:0 0 24px;">Thank you, ${escapeHtml(order.customerName)}. Your receipt has been created and your order has been received.</p>
        <div style="background:#080808;border:1px solid #252525;padding:18px;margin-bottom:22px;">
          <div style="color:#9CA3AF;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">Order number</div>
          <div style="color:#D4AF37;font-size:24px;font-weight:700;">${escapeHtml(order.orderNumber)}</div>
          <div style="color:#9CA3AF;margin-top:8px;">${formatDate(order.createdAt)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
          <thead>
            <tr>
              <th align="left" style="color:#D4AF37;padding-bottom:10px;">Item</th>
              <th align="center" style="color:#D4AF37;padding-bottom:10px;">Qty</th>
              <th align="right" style="color:#D4AF37;padding-bottom:10px;">Total</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <div style="font-size:14px;text-align:right;color:#9CA3AF;">Subtotal: ${formatCurrency(order.subtotal)}</div>
        <div style="font-size:14px;text-align:right;color:#9CA3AF;margin-top:4px;">Delivery: ${formatCurrency(order.deliveryFee)}</div>
        <div style="font-size:20px;text-align:right;margin:8px 0 22px;">Total: <strong style="color:#D4AF37;">${formatCurrency(order.total)}</strong></div>
        <div style="margin-top:24px;border:1px solid #252525;background:#080808;padding:18px;">
          <div style="color:#D4AF37;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;">Delivery details</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">${deliveryDetails}</table>
        </div>
        ${order.notes ? `<p style="color:#9CA3AF;margin:0 0 24px;"><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ""}
        <p style="color:#9CA3AF;margin:24px 0 0;">We will contact you if we need to confirm anything. You can reach us at ${escapeHtml(storeConfig.email)} or ${escapeHtml(storeConfig.phone)}.</p>
      </div>
    </div>
  `;
}

export async function sendOrderEmails(order: EmailOrder) {
  const transport = getTransport();

  if (!transport) {
    console.warn("SMTP is not configured; skipping order email.");
    return false;
  }

  const from = process.env.SMTP_FROM || `${storeConfig.name} <${storeConfig.email}>`;
  const html = renderOrderEmail(order);

  try {
    await transport.sendMail({
      from,
      to: order.customerEmail,
      subject: `Your ${storeConfig.name} order ${order.orderNumber}`,
      html
    });

    if (process.env.ADMIN_NOTIFY_EMAIL) {
      await transport.sendMail({
        from,
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `New order ${order.orderNumber}`,
        html
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to send order email", error);
    return false;
  }
}

export async function sendPlainEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const transport = getTransport();

  if (!transport) {
    return { ok: false, error: "SMTP is not configured." };
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || `${storeConfig.name} <${storeConfig.email}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    });

    return { ok: true };
  } catch (error) {
    console.error("Failed to send email", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to send email." };
  }
}
