"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, LinkIcon, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PageOption = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
};

type AdminMenuItem = {
  id: string;
  label: string;
  href: string | null;
  type: "INTERNAL" | "PAGE" | "EXTERNAL";
  position: number;
  visible: boolean;
  pageId: string | null;
  page: PageOption | null;
};

export function MenuManager({ initialItems, pages }: { initialItems: AdminMenuItem[]; pages: PageOption[] }) {
  const router = useRouter();
  const [items, setItems] = useState(() => [...initialItems].sort((a, b) => a.position - b.position));
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id || "");
  const [customLabel, setCustomLabel] = useState("");
  const [customHref, setCustomHref] = useState("");
  const [message, setMessage] = useState("");
  const pageIdsInMenu = useMemo(() => new Set(items.filter((item) => item.type === "PAGE").map((item) => item.pageId)), [items]);

  function menuHref(item: AdminMenuItem) {
    if (item.type === "PAGE") {
      return item.page ? `/${item.page.slug}` : "Missing page";
    }

    return item.href || "";
  }

  async function reorder(nextItems: AdminMenuItem[]) {
    setItems(nextItems.map((item, index) => ({ ...item, position: index })));
    setMessage("");

    const response = await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: nextItems.map((item) => item.id) })
    });

    if (!response.ok) {
      setMessage("Unable to save menu order.");
      router.refresh();
    }
  }

  async function saveItem(item: AdminMenuItem) {
    setMessage("");

    const response = await fetch(`/api/menu/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: item.label,
        href: item.href || "",
        type: item.type,
        visible: item.visible,
        pageId: item.pageId
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "Unable to save menu item.");
      return;
    }

    router.refresh();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Remove this menu item?")) {
      return;
    }

    const response = await fetch(`/api/menu/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessage("Unable to remove menu item.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    router.refresh();
  }

  async function addPageLink() {
    const page = pages.find((candidate) => candidate.id === selectedPageId);

    if (!page) {
      return;
    }

    const response = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: page.title,
        type: "PAGE",
        visible: true,
        pageId: page.id
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "Unable to add page to menu.");
      return;
    }

    router.refresh();
  }

  async function addCustomLink() {
    if (!customLabel.trim() || !customHref.trim()) {
      setMessage("Enter a label and URL for the custom menu item.");
      return;
    }

    const response = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: customLabel,
        href: customHref,
        type: customHref.startsWith("http") ? "EXTERNAL" : "INTERNAL",
        visible: true
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "Unable to add custom menu item.");
      return;
    }

    setCustomLabel("");
    setCustomHref("");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-white/10 bg-obsidian p-5">
          <h2 className="font-heading text-2xl text-mist">Add page</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <select value={selectedPageId} onChange={(event) => setSelectedPageId(event.target.value)} className="input-field">
              {pages.map((page) => (
                <option key={page.id} value={page.id} disabled={pageIdsInMenu.has(page.id)}>
                  {page.title}
                </option>
              ))}
            </select>
            <button type="button" onClick={addPageLink} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </section>

        <section className="rounded-md border border-white/10 bg-obsidian p-5">
          <h2 className="font-heading text-2xl text-mist">Add custom link</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} className="input-field" placeholder="Label" />
            <input value={customHref} onChange={(event) => setCustomHref(event.target.value)} className="input-field" placeholder="/shop or https://..." />
            <button type="button" onClick={addCustomLink} className="btn-primary">
              <LinkIcon className="h-4 w-4" />
              Add
            </button>
          </div>
        </section>
      </div>

      {message ? <p className="rounded-md border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{message}</p> : null}

      <section className="rounded-md border border-white/10 bg-obsidian">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-heading text-2xl text-mist">Menu order</h2>
        </div>
        <div className="divide-y divide-white/10">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[84px_1fr_1fr_120px_148px] lg:items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => index > 0 && reorder([...items.slice(0, index - 1), item, items[index - 1], ...items.slice(index + 1)])}
                  disabled={index === 0}
                  className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-muted hover:text-gold disabled:opacity-40"
                  aria-label="Move up"
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => index < items.length - 1 && reorder([...items.slice(0, index), items[index + 1], item, ...items.slice(index + 2)])}
                  disabled={index === items.length - 1}
                  className="grid h-10 w-10 place-items-center rounded-md border border-white/10 text-muted hover:text-gold disabled:opacity-40"
                  aria-label="Move down"
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <label>
                <span className="label">Label</span>
                <input
                  value={item.label}
                  onChange={(event) =>
                    setItems((current) => current.map((candidate) => (candidate.id === item.id ? { ...candidate, label: event.target.value } : candidate)))
                  }
                  className="input-field"
                />
              </label>

              <label>
                <span className="label">URL</span>
                <input
                  value={menuHref(item)}
                  onChange={(event) =>
                    setItems((current) => current.map((candidate) => (candidate.id === item.id ? { ...candidate, href: event.target.value } : candidate)))
                  }
                  disabled={item.type === "PAGE"}
                  className="input-field disabled:opacity-60"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  const next = { ...item, visible: !item.visible };
                  setItems((current) => current.map((candidate) => (candidate.id === item.id ? next : candidate)));
                  saveItem(next);
                }}
                className="btn-secondary h-11 self-end"
              >
                {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {item.visible ? "Visible" : "Hidden"}
              </button>

              <div className="flex gap-2 self-end">
                <button type="button" onClick={() => saveItem(item)} className="grid h-11 w-11 place-items-center rounded-md border border-white/10 text-muted hover:text-gold" aria-label="Save menu item" title="Save menu item">
                  <Save className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => deleteItem(item.id)} className="grid h-11 w-11 place-items-center rounded-md border border-white/10 text-muted hover:border-red-400/40 hover:text-red-200" aria-label="Delete menu item" title="Delete menu item">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
