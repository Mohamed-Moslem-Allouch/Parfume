"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<string, { name: string }>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, { name: c.name }]))
  );
  const [message, setMessage] = useState("");

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "Unable to create category.");
      return;
    }

    setNewName("");
    router.refresh();
  }

  async function saveCategory(id: string) {
    setMessage("");
    const data = editing[id] || categories.find(c => c.id === id);
    if (!data) return;

    const response = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name })
    });

    if (!response.ok) {
      const respData = (await response.json()) as { message?: string };
      setMessage(respData.message || "Unable to save category.");
      return;
    }

    router.refresh();
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;
    setMessage("");

    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "Unable to delete category.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={createCategory} className="liquid-glass grid gap-4 rounded-3xl p-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <label>
          <span className="label">New Category Name</span>
          <input 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            className="input-field" 
            placeholder="e.g. Perfume Inspire" 
            required 
          />
        </label>
        <button type="submit" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </form>

      {message && <p className="rounded-2xl border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">{message}</p>}

      <div className="liquid-glass rounded-3xl overflow-hidden">
        <div className="divide-y divide-white/10">
          {categories.map((category) => (
            <div key={category.id} className="grid gap-4 p-5 md:grid-cols-[1fr_110px_110px] md:items-center">
              <div>
                <input
                  value={editing[category.id]?.name ?? category.name}
                  onChange={(e) => setEditing(prev => ({ ...prev, [category.id]: { ...prev[category.id], name: e.target.value } }))}
                  className="input-field"
                />
              </div>

              <div className="text-sm">
                <p className="text-mist font-bold">{category._count.products} <span className="text-xs font-normal text-muted">products</span></p>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => saveCategory(category.id)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-muted hover:bg-gold/10 hover:text-gold transition-colors">
                  <Save className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => deleteCategory(category.id)} className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-muted hover:bg-red-950/40 hover:text-red-200 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
