import Image from "next/image";
import Link from "next/link";
import { Edit3, Eye, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeletePageButton } from "@/components/admin/delete-page-button";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requireAdmin();

  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Custom pages</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Page builder</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">Create landing pages and decide which products appear on each one.</p>
        </div>
        <Link href="/admin/pages/new" className="btn-primary w-fit">
          <Plus className="h-4 w-4" />
          Add Page
        </Link>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <article key={page.id} className="grid gap-4 rounded-md border border-white/10 bg-obsidian p-4 md:grid-cols-[1fr_auto]">

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-heading text-2xl text-mist">{page.title}</h2>
                <span className={page.published ? "rounded-md bg-green-500/15 px-2 py-1 text-xs text-green-200" : "rounded-md bg-white/10 px-2 py-1 text-xs text-muted"}>
                  {page.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gold">/{page.slug}</p>
              <p className="mt-3 max-w-2xl text-sm text-muted">{page.excerpt || "No excerpt yet."}</p>
              <p className="mt-3 text-xs text-muted">
                {page._count.products} products · Updated {formatDate(page.updatedAt)}
              </p>
            </div>
            <div className="flex items-start justify-end gap-2">
              <Link href={`/${page.slug}`} className="grid h-10 w-10 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-gold" aria-label="View page" title="View page">
                <Eye className="h-4 w-4" />
              </Link>
              <Link href={`/admin/pages/${page.id}/edit`} className="grid h-10 w-10 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-gold" aria-label="Edit page" title="Edit page">
                <Edit3 className="h-4 w-4" />
              </Link>
              <DeletePageButton pageId={page.id} pageTitle={page.title} />
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
