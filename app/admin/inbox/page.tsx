import { AdminShell } from "@/components/admin/admin-shell";
import { UnifiedInbox } from "@/components/admin/unified-inbox";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  await requireAdmin();

  const messages = await prisma.inboxMessage.findMany({
    include: {
      replies: {
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100
  });

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Unified inbox</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Messages</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Email replies work through SMTP. Instagram and Facebook messages appear here once Meta Page credentials are connected.
        </p>
      </div>
      <UnifiedInbox
        messages={messages.map((message) => ({
          ...message,
          lastMessageAt: message.lastMessageAt.toISOString(),
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
          replies: message.replies.map((reply) => ({
            ...reply,
            createdAt: reply.createdAt.toISOString()
          }))
        }))}
      />
    </AdminShell>
  );
}
