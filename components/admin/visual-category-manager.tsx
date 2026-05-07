"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Plus, Save, Trash2, ChevronRight, Image as ImageIcon, Check, Pencil, X } from "lucide-react";
import Image from "next/image";

type VisualCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  _count: {
    products: number;
    children: number;
    pages: number;
  };
  pages?: {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    _count: { products: number };
  }[];
};

export function VisualCategoryManager({ categories }: { categories: VisualCategory[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showSubPrompt, setShowSubPrompt] = useState<{ id: string; name: string } | null>(null);

  const categoryIds = new Set(categories.map((category) => category.id));
  const normalRoots = categories.filter((category) => !category.parentId || !categoryIds.has(category.parentId));
  // Recovery mode: if bad data creates a parent cycle with no roots, still show all nodes so admin can fix them.
  const roots = normalRoots.length ? normalRoots : categories;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/visual-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newName, 
        image: newImage || null,
        parentId: newParentId 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Unable to create collection.");
      return;
    }

    const created = data.category;
    setNewName("");
    setNewImage("");
    setNewParentId(null);
    
    // If it's a root or a middle-level category, ask to add subcategories
    setShowSubPrompt({ id: created.id, name: created.name });
    router.refresh();
  }

  async function updateCategory(id: string, name: string, image: string | null, parentId: string | null) {
    const response = await fetch(`/api/visual-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image, parentId })
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Error updating.");
      return;
    }
    router.refresh();
  }

  async function deleteCategory(id: string) {
    if (!window.confirm("Delete this collection? Items will be unlinked.")) return;
    const response = await fetch(`/api/visual-categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Error deleting.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-10">
      <section className="liquid-glass rounded-[2.5rem] p-8">
        <h2 className="font-heading text-2xl text-mist mb-6 flex items-center gap-3">
          <Plus className="h-6 w-6 text-gold" />
          Create New Collection
        </h2>
        
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label>
            <span className="label">Collection Name</span>
            <input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              className="input-field" 
              placeholder="e.g. Parfums Inspirés" 
              required 
            />
          </label>
          <label>
            <span className="label">Cover Image URL</span>
            <input 
              value={newImage} 
              onChange={(e) => setNewImage(e.target.value)} 
              className="input-field" 
              placeholder="/uploads/inspired.jpg" 
            />
          </label>
          <label>
            <span className="label">Parent Category</span>
            <select
              value={newParentId || ""}
              onChange={(e) => setNewParentId(e.target.value || null)}
              className="input-field"
            >
              <option value="">None (Top Level)</option>
              {roots.map((root) => (
                <option key={root.id} value={root.id}>
                  {root.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full h-[52px]">
              Create Collection
            </button>
          </div>
        </form>

        {showSubPrompt && (
          <div className="mt-6 rounded-2xl bg-gold/10 border border-gold/20 p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-mist">
              <span className="text-gold font-bold">&quot;{showSubPrompt.name}&quot;</span> created. Do you want to add subcategories to it?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setNewParentId(showSubPrompt.id);
                  setShowSubPrompt(null);
                }}
                className="btn-secondary py-2 px-4 text-xs h-auto"
              >
                Yes, add subcategories
              </button>
              <button 
                onClick={() => setShowSubPrompt(null)}
                className="text-muted hover:text-mist text-xs underline px-4"
              >
                No, I&apos;m done
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6">
        <h2 className="font-heading text-2xl text-mist">Existing Hierarchy</h2>
        {!normalRoots.length && categories.length > 0 ? (
          <p className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-3 text-xs text-amber-200">
            Warning: collection hierarchy has no top-level roots (likely circular parent links). Showing all collections so you can fix parent assignments.
          </p>
        ) : null}
        <div className="grid gap-4">
          {roots.map(root => (
            <CategoryRow 
              key={root.id} 
              category={root} 
              allCategories={categories} 
              onDelete={deleteCategory} 
              onUpdate={updateCategory}
              ancestorIds={new Set()}
            />
          ))}
        </div>
      </section>
      
      {message && <p className="text-red-400 text-sm p-4 rounded-xl bg-red-950/20 border border-red-900/50">{message}</p>}
    </div>
  );
}

function CategoryRow({ 
  category, 
  allCategories, 
  onDelete, 
  onUpdate,
  depth = 0,
  ancestorIds
}: { 
  category: VisualCategory; 
  allCategories: VisualCategory[]; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, image: string | null, parentId: string | null) => void;
  depth?: number;
  ancestorIds: Set<string>;
}) {
  const children = allCategories.filter((c) => c.parentId === category.id && !ancestorIds.has(c.id));
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState(category.name);
  const [editImage, setEditImage] = useState(category.image || "");
  const [editParentId, setEditParentId] = useState(category.parentId || "");

  // Recursive helper to get all descendants of a category to prevent circular moves
  function getDescendantIds(catId: string): string[] {
    const children = allCategories.filter(c => c.parentId === catId);
    let ids = children.map(c => c.id);
    for (const child of children) {
      ids = [...ids, ...getDescendantIds(child.id)];
    }
    return ids;
  }

  const descendantIds = getDescendantIds(category.id);
  const possibleParents = allCategories.filter(c => 
    c.id !== category.id && !descendantIds.includes(c.id)
  );

  async function handleSave() {
    await onUpdate(category.id, editName, editImage || null, editParentId || null);
    setIsEditing(false);
  }

  return (
    <div className="space-y-3">
      <div className={`liquid-glass flex flex-col gap-4 p-4 rounded-2xl border-l-4 ${depth > 0 ? "border-l-gold/30 ml-8" : "border-l-gold"}`}>
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-charcoal border border-white/10 shrink-0">
            {category.image ? (
              <Image src={category.image} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <p className="font-bold text-mist truncate">{category.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">
              {[
                children.length > 0 ? `${children.length} sub-collection${children.length === 1 ? "" : "s"}` : null,
                category._count.pages > 0 ? `${category._count.pages} linked page${category._count.pages === 1 ? "" : "s"}` : null,
                children.length === 0 && category._count.pages === 0
                  ? `${category._count.products + (category.pages?.reduce((acc, p) => acc + p._count.products, 0) || 0)} total products`
                  : null
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {children.length > 0 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-muted hover:text-mist hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>
            )}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-all"
            >
              {isEditing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </button>
            <button 
              onClick={() => onDelete(category.id)}
              className="p-2 text-muted hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isEditing && (
          <div className="grid gap-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-1">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className="label">Edit Name</span>
                <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="input-field py-2 text-sm" 
                />
              </label>
              <label>
                <span className="label">Edit Image URL</span>
                <input 
                  value={editImage} 
                  onChange={(e) => setEditImage(e.target.value)} 
                  className="input-field py-2 text-sm" 
                />
              </label>
              <label>
                <span className="label">Move to Collection</span>
                <select 
                  value={editParentId} 
                  onChange={(e) => setEditParentId(e.target.value)} 
                  className="input-field py-2 text-sm"
                >
                  <option value="">(None - Top Level)</option>
                  {possibleParents.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <button 
              onClick={handleSave}
              className="btn-primary py-2 text-xs h-auto w-fit px-6 flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </button>
          </div>
        )}

        {category.pages && category.pages.length > 0 ? (
          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-3">
              Linked pages ({category.pages.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {category.pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-mist"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{page.title}</p>
                    <p className="truncate text-[10px] text-muted">
                      /{page.slug} · {page._count.products} products · {page.published ? "published" : "draft"}
                    </p>
                  </div>
                  <Link href={`/admin/pages/${page.id}/edit`} className="shrink-0 text-gold hover:underline">
                    Edit
                  </Link>
                  <Link href={`/${page.slug}`} className="shrink-0 text-muted hover:text-mist hover:underline">
                    View
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted">
              These are CMS pages assigned to this collection (not sub-collections). Sub-collections appear in the tree above/below as nested rows.
            </p>
          </div>
        ) : null}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="grid gap-3">
          {children.map(child => (
            <CategoryRow 
              key={child.id} 
              category={child} 
              allCategories={allCategories} 
              onDelete={onDelete} 
              onUpdate={onUpdate}
              depth={depth + 1}
              ancestorIds={new Set([...ancestorIds, category.id])}
            />
          ))}
        </div>
      )}
    </div>
  );
}
