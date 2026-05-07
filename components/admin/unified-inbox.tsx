"use client";

import { AlertTriangle, Archive, Mail, MessageCircle, Paperclip, RefreshCw, Search, Send, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type InboxMessage = {
  id: string;
  source: string;
  externalId?: string | null;
  threadId?: string | null;
  sourceProfileId?: string | null;
  fromName: string | null;
  fromAddress: string | null;
  toAddress?: string | null;
  ccAddress?: string | null;
  replyTo?: string | null;
  avatarUrl: string | null;
  subject: string | null;
  body: string;
  htmlBody?: string | null;
  rawHeaders?: string;
  blockedImages?: number;
  attachments?: string;
  status: string;
  lastMessageAt: string;
  replies: {
    id: string;
    body: string;
    channel: string;
    sent: boolean;
    error: string | null;
    createdAt: string;
  }[];
};

type Attachment = {
  filename: string;
  contentType: string;
  size: number;
};

const sourceIcons = {
  EMAIL: Mail,
  INSTAGRAM: MessageCircle,
  FACEBOOK: MessageCircle
};

const channelStyles: Record<string, string> = {
  EMAIL: "border-sky-500/25 bg-sky-500/12 text-sky-300",
  INSTAGRAM: "border-pink-500/25 bg-pink-500/12 text-pink-300",
  FACEBOOK: "border-blue-500/25 bg-blue-500/12 text-blue-300"
};

function initials(message: InboxMessage) {
  const name = message.fromName || message.fromAddress || message.source;
  return name
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function parseJsonList<T>(value?: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Avatar({ message, size = "md" }: { message: InboxMessage; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  if (message.avatarUrl) {
    return (
      <span className={cn(dimensions, "relative shrink-0 overflow-hidden rounded-full border border-white/10")}>
        <Image src={message.avatarUrl} alt={message.fromName || message.source} fill sizes="56px" className="object-cover" />
      </span>
    );
  }

  return (
    <span className={cn(dimensions, "grid shrink-0 place-items-center rounded-full border border-gold/25 bg-gold/15 font-bold text-gold")}>
      {initials(message)}
    </span>
  );
}

function EmailMeta({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">{label}</p>
      <p className="mt-1 break-words text-sm text-mist">{value}</p>
    </div>
  );
}

function EmailBody({ message, richEmailView }: { message: InboxMessage; richEmailView: boolean }) {
  const attachments = parseJsonList<Attachment>(message.attachments);

  return (
    <article className="rounded-md border border-white/10 bg-midnight p-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <EmailMeta label="From" value={`${message.fromName || "Unknown"}${message.fromAddress ? ` <${message.fromAddress}>` : ""}`} />
          <EmailMeta label="To" value={message.toAddress || "Not available"} />
          <EmailMeta label="Reply-To" value={message.replyTo} />
          <EmailMeta label="Cc" value={message.ccAddress} />
        </div>
        <p className="shrink-0 text-xs text-muted">{formatDate(message.lastMessageAt)}</p>
      </div>

      {message.blockedImages ? (
        <div className="mt-4 flex gap-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{message.blockedImages} email image{message.blockedImages === 1 ? "" : "s"} blocked. Remote email images can require authenticated mailbox access.</p>
        </div>
      ) : null}

      {attachments.length ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold">
            <Paperclip className="h-4 w-4" />
            Attachments
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {attachments.map((attachment, index) => (
              <p key={`${attachment.filename}-${index}`} className="truncate rounded-md border border-white/10 bg-obsidian px-3 py-2 text-xs text-muted">
                {attachment.filename} - {attachment.contentType} - {Math.ceil(attachment.size / 1024)} KB
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {message.htmlBody && richEmailView ? (
        <iframe
          title={message.subject || "Email body"}
          srcDoc={message.htmlBody}
          sandbox=""
          referrerPolicy="no-referrer"
          className="mt-4 h-[38rem] w-full rounded-md border border-white/10 bg-white"
        />
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-mist">{message.body}</p>
      )}
    </article>
  );
}

export function UnifiedInbox({ messages }: { messages: InboxMessage[] }) {
  const router = useRouter();
  const [source, setSource] = useState("ALL");
  const [selectedId, setSelectedId] = useState(messages[0]?.id || "");
  const [search, setSearch] = useState("");
  const [richEmailView, setRichEmailView] = useState(true);
  const [autoSyncEmail, setAutoSyncEmail] = useState(true);
  const [reply, setReply] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesSource = source === "ALL" || message.source === source;
      const matchesSearch =
        !term ||
        message.subject?.toLowerCase().includes(term) ||
        message.body.toLowerCase().includes(term) ||
        message.fromName?.toLowerCase().includes(term) ||
        message.fromAddress?.toLowerCase().includes(term) ||
        message.toAddress?.toLowerCase().includes(term);

      return matchesSource && matchesSearch;
    });
  }, [messages, search, source]);

  const selected = messages.find((message) => message.id === selectedId) || filtered[0] || messages[0];
  const selectedThread = selected
    ? messages.filter((message) => (message.threadId || message.id) === (selected.threadId || selected.id))
    : [];
  const counts = {
    ALL: messages.length,
    EMAIL: messages.filter((message) => message.source === "EMAIL").length,
    INSTAGRAM: messages.filter((message) => message.source === "INSTAGRAM").length,
    FACEBOOK: messages.filter((message) => message.source === "FACEBOOK").length
  };

  useEffect(() => {
    const richPreference = window.localStorage.getItem("inbox-rich-email-view");
    const autoSyncPreference = window.localStorage.getItem("inbox-auto-sync-email");

    if (richPreference) setRichEmailView(richPreference === "true");
    if (autoSyncPreference) setAutoSyncEmail(autoSyncPreference === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("inbox-rich-email-view", String(richEmailView));
  }, [richEmailView]);

  useEffect(() => {
    window.localStorage.setItem("inbox-auto-sync-email", String(autoSyncEmail));
  }, [autoSyncEmail]);

  useEffect(() => {
    if (!autoSyncEmail) return;
    let cancelled = false;

    async function backgroundSync() {
      if (document.visibilityState === "hidden") return;

      const response = await fetch("/api/inbox/sync?channel=email", { method: "POST" }).catch(() => null);
      if (!cancelled && response?.ok) {
        router.refresh();
      }
    }

    const first = window.setTimeout(backgroundSync, 3000);
    const interval = window.setInterval(backgroundSync, 60000);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [autoSyncEmail, router]);

  async function syncInbox(channel: "all" | "email" | "meta") {
    setSyncing(true);
    setNotice("");
    const response = await fetch(`/api/inbox/sync?channel=${channel}`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setSyncing(false);
    setNotice(response.ok ? `Synced ${data.synced || 0} messages.` : data.message || "Inbox sync failed.");
    if (response.ok) router.refresh();
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;

    setSending(true);
    setNotice("");
    const response = await fetch(`/api/inbox/${selected.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply })
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);
    setNotice(response.ok ? "Reply sent." : data.message || "Reply failed.");
    if (response.ok) {
      setReply("");
      router.refresh();
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-obsidian">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-field h-12 rounded-full pl-11"
            placeholder="Search mail and messages"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "EMAIL", "INSTAGRAM", "FACEBOOK"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setSource(item);
                const next = messages.find((message) => item === "ALL" || message.source === item);
                setSelectedId(next?.id || "");
              }}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition",
                source === item ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-white/5 text-muted hover:text-mist"
              )}
            >
              {item === "ALL" ? "All" : item} <span className="ml-1 text-mist">{counts[item]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <input
              type="checkbox"
              checked={richEmailView}
              onChange={(event) => setRichEmailView(event.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Rich email view
          </label>
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <input
              type="checkbox"
              checked={autoSyncEmail}
              onChange={(event) => setAutoSyncEmail(event.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Auto-sync email
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => syncInbox("all")} className="btn-primary h-11 px-4 py-2" disabled={syncing}>
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            Sync All
          </button>
          <button type="button" onClick={() => syncInbox("email")} className="btn-secondary h-11 px-4 py-2" disabled={syncing}>
            Email
          </button>
          <button type="button" onClick={() => syncInbox("meta")} className="btn-secondary h-11 px-4 py-2" disabled={syncing}>
            Meta
          </button>
        </div>
      </div>

      {notice ? <p className="border-b border-gold/20 bg-gold/10 p-3 text-xs text-muted">{notice}</p> : null}

      <div className="grid min-h-[680px] xl:grid-cols-[390px_1fr]">
        <aside className="border-b border-white/10 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Inbox</p>
            <div className="flex items-center gap-1 text-muted">
              <Archive className="h-4 w-4" />
              <Star className="h-4 w-4" />
            </div>
          </div>
          <div className="max-h-[680px] overflow-y-auto">
            {filtered.map((message) => {
              const Icon = sourceIcons[message.source as keyof typeof sourceIcons] || Mail;
              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(message.id);
                    if (message.status === "UNREAD") {
                      fetch(`/api/inbox/${message.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "OPEN" })
                      }).catch(() => undefined);
                    }
                  }}
                  className={cn(
                    "grid w-full grid-cols-[auto_1fr_auto] gap-3 border-b border-white/10 p-4 text-left transition hover:bg-white/[0.03]",
                    selected?.id === message.id && "bg-gold/10",
                    message.status === "UNREAD" && "font-bold"
                  )}
                >
                  <Avatar message={message} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-mist">{message.fromName || message.fromAddress || "Unknown sender"}</p>
                      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", channelStyles[message.source] || channelStyles.EMAIL)}>
                        <Icon className="h-3 w-3" />
                        {message.source}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-mist">{message.subject || "No subject"}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{message.body}</p>
                  </div>
                  <span className="whitespace-nowrap text-[11px] text-muted">{formatDate(message.lastMessageAt)}</span>
                </button>
              );
            })}
            {!filtered.length ? <p className="p-5 text-sm text-muted">No messages for this view yet.</p> : null}
          </div>
        </aside>

        <section className="min-w-0">
          {selected ? (
            <>
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <Avatar message={selected} size="lg" />
                    <div className="min-w-0">
                      <p className={cn("mb-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]", channelStyles[selected.source] || channelStyles.EMAIL)}>
                        {selected.source}
                      </p>
                      <h2 className="font-heading text-2xl text-mist">{selected.subject || "No subject"}</h2>
                      <p className="mt-2 text-sm text-muted">
                        {selected.fromName || "Unknown"} {selected.fromAddress ? `<${selected.fromAddress}>` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted">{formatDate(selected.lastMessageAt)}</p>
                </div>
              </div>
              <div className="grid gap-4 p-5">
                {selectedThread.map((threadMessage) =>
                  threadMessage.source === "EMAIL" ? (
                    <EmailBody key={threadMessage.id} message={threadMessage} richEmailView={richEmailView} />
                  ) : (
                    <article key={threadMessage.id} className="flex gap-3 rounded-md border border-white/10 bg-midnight p-4">
                      <Avatar message={threadMessage} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-mist">{threadMessage.fromName || threadMessage.source}</p>
                          <p className="text-xs text-muted">{formatDate(threadMessage.lastMessageAt)}</p>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-mist">{threadMessage.body}</p>
                      </div>
                    </article>
                  )
                )}
                {selected.replies.map((item) => (
                  <article key={item.id} className="ml-auto w-full max-w-2xl rounded-md border border-gold/20 bg-gold/10 p-4 text-sm leading-7 text-mist">
                    <p className="whitespace-pre-wrap">{item.body}</p>
                    <p className="mt-3 text-xs text-muted">
                      {item.sent ? "Sent" : item.error || "Not sent"} - {formatDate(item.createdAt)}
                    </p>
                  </article>
                ))}
                <form onSubmit={submitReply} className="sticky bottom-0 grid gap-3 border-t border-white/10 bg-obsidian/95 pt-5 backdrop-blur-xl">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={5}
                    className="input-field resize-none rounded-2xl"
                    placeholder="Write a reply..."
                  />
                  <button type="submit" disabled={sending || !reply.trim()} className="btn-primary w-fit">
                    <Send className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-heading text-2xl text-mist">No messages yet</p>
              <p className="mt-2 text-sm text-muted">Sync your email inbox or Meta channels to begin.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
