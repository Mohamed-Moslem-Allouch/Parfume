import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { buildPlainTextEmailHtml, sanitizeEmailHtml } from "@/lib/email-html";

function addressText(value: unknown): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.map((item) => addressText(item)).filter(Boolean).join(", ");
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text;
  return String(value);
}

function headerValueText(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(headerValueText).filter(Boolean).join(", ");
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export async function syncEmailInbox(limit = 25) {
  const host = process.env.IMAP_HOST;
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return { ok: false, error: "IMAP is not configured.", messages: [] as any[] };
  }

  const client = new ImapFlow({
    host,
    port: Number(process.env.IMAP_PORT || "993"),
    secure: process.env.IMAP_SECURE !== "false",
    auth: { user, pass },
    logger: false
  });

  const messages: {
    externalId: string;
    threadId: string | null;
    fromName: string | null;
    fromAddress: string | null;
    toAddress: string | null;
    ccAddress: string | null;
    replyTo: string | null;
    subject: string | null;
    body: string;
    htmlBody: string | null;
    rawHeaders: string;
    blockedImages: number;
    attachments: string;
    lastMessageAt: Date;
  }[] = [];

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const searchResult = await client.search({ since }, { uid: true });
    const uids = Array.isArray(searchResult) ? searchResult.slice(-limit) : [];

    for await (const message of client.fetch(uids, { uid: true, envelope: true, source: { maxLength: 2000000 }, threadId: true, internalDate: true }, { uid: true })) {
      const parsed = message.source ? await simpleParser(message.source) : null;
      const from = parsed?.from?.value?.[0] || message.envelope?.from?.[0];
      const text = parsed?.text || (parsed?.html ? parsed.html.replace(/<[^>]+>/g, " ") : "");
      const htmlSource = typeof parsed?.html === "string" && parsed.html.trim() ? parsed.html : buildPlainTextEmailHtml(text);
      const sanitized = sanitizeEmailHtml(htmlSource);
      const rawHeaders = parsed
        ? Array.from(parsed.headers.entries()).map(([key, value]) => ({ key, value: headerValueText(value) }))
        : [];
      const attachments = parsed?.attachments.map((attachment) => ({
        filename: attachment.filename || "attachment",
        contentType: attachment.contentType,
        size: attachment.size
      })) || [];

      messages.push({
        externalId: String(message.uid),
        threadId: message.threadId ? String(message.threadId) : null,
        fromName: from?.name || null,
        fromAddress: from?.address || null,
        toAddress: addressText(parsed?.to) || null,
        ccAddress: addressText(parsed?.cc) || null,
        replyTo: addressText(parsed?.replyTo) || null,
        subject: parsed?.subject || message.envelope?.subject || null,
        body: text.replace(/\s+/g, " ").trim().slice(0, 8000) || "(No message body)",
        htmlBody: sanitized.html,
        rawHeaders: JSON.stringify(rawHeaders),
        blockedImages: sanitized.blockedImages,
        attachments: JSON.stringify(attachments),
        lastMessageAt: new Date(parsed?.date || message.internalDate || Date.now())
      });
    }
  } finally {
    lock.release();
    await client.logout().catch(() => undefined);
  }

  return { ok: true, messages };
}
