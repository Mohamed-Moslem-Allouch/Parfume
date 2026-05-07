"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ImagePlus, Save, Search, X } from "lucide-react";

type ProductOption = {
  id: string;
  name: string;
  images: string[];
  category: { name: string };
  pages: { id: string; title: string; slug: string }[];
};

type VisualCategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
};

type CmsPage = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  heroImage: string | null;
  collectionImage?: string | null;
  published: boolean;
  visualCategoryId?: string | null;
  products: { id: string }[];
  menuItems: { id: string; label: string; visible: boolean }[];
};

export function PageForm({ 
  products, 
  page,
  visualCategories = []
}: { 
  products: ProductOption[]; 
  page?: CmsPage;
  visualCategories?: VisualCategoryOption[];
}) {
  const router = useRouter();
  const [collectionImage, setCollectionImage] = useState(page?.collectionImage || "");
  const [productIds, setProductIds] = useState<string[]>(page?.products.map((product) => product.id) || []);
  const [visualCategoryId, setVisualCategoryId] = useState(page?.visualCategoryId || "");
  const [showInMenu, setShowInMenu] = useState(page ? Boolean(page.menuItems.find((item) => item.visible)) : true);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productStatus, setProductStatus] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedProductIds = useMemo(() => new Set(productIds), [productIds]);
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category.name))).sort(), [products]);
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const alreadyOnOtherPage = product.pages.some((linkedPage) => linkedPage.id !== page?.id);
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.name.toLowerCase().includes(term) ||
        product.pages.some((linkedPage) => linkedPage.title.toLowerCase().includes(term));
      const matchesCategory = !productCategory || product.category.name === productCategory;
      const matchesStatus =
        productStatus === "all" ||
        (productStatus === "selected" && selectedProductIds.has(product.id)) ||
        (productStatus === "unassigned" && product.pages.length === 0) ||
        (productStatus === "used" && alreadyOnOtherPage) ||
        (productStatus === "not-selected" && !selectedProductIds.has(product.id));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [page?.id, productCategory, productSearch, productStatus, products, selectedProductIds]);

  function toggleProduct(productId: string, checked: boolean) {
    setProductIds((current) => {
      if (checked) {
        return current.includes(productId) ? current : [...current, productId];
      }

      return current.filter((id) => id !== productId);
    });
  }



  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      excerpt: String(formData.get("excerpt") || ""),
      content: String(formData.get("content") || ""),
      published: formData.get("published") === "on",
      showInMenu,
      menuLabel: String(formData.get("menuLabel") || ""),
      visualCategoryId: visualCategoryId || null,
      collectionImage: collectionImage || null,
      productIds
    };

    try {
      const response = await fetch(page ? `/api/pages/${page.id}` : "/api/pages", {
        method: page ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      // Defensive JSON parsing
      const data = response.status !== 204 ? await response.json().catch(() => ({})) : {};

      if (!response.ok) {
        throw new Error(data.message || "Unable to save page.");
      }

      router.push("/admin/pages");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save page.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="grid gap-5 rounded-md border border-white/10 bg-obsidian p-5 sm:p-6">
        <label>
          <span className="label">Page title</span>
          <input name="title" defaultValue={page?.title} required className="input-field" />
        </label>
        <label>
          <span className="label">Slug</span>
          <input name="slug" defaultValue={page?.slug} placeholder="summer-oud-collection" className="input-field" />
        </label>
        <label>
          <span className="label">Excerpt</span>
          <input name="excerpt" defaultValue={page?.excerpt || ""} className="input-field" />
        </label>
        <label>
          <span className="label">Content</span>
          <textarea name="content" defaultValue={page?.content} rows={12} required className="input-field resize-none" />
        </label>
        <label className="flex items-center gap-3 rounded-md border border-white/10 bg-midnight p-4 text-sm text-mist">
          <input name="published" type="checkbox" defaultChecked={page?.published ?? true} className="h-4 w-4 accent-gold" />
          Published
        </label>
        <label>
          <span className="label">Collection (Visual Hierarchy)</span>
          <select 
            value={visualCategoryId || ""} 
            onChange={(e) => setVisualCategoryId(e.target.value)} 
            className="input-field"
          >
            <option value="">None (Standalone Page)</option>
            {visualCategories.map((vc) => {
              const parent = vc.parentId ? visualCategories.find(p => p.id === vc.parentId) : null;
              const label = parent ? `${parent.name} > ${vc.name}` : vc.name;
              return (
                <option key={vc.id} value={vc.id}>
                  {label}
                </option>
              );
            })}
          </select>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Assigning this page to a collection will make it visible in the &quot;Explore&quot; menu.</p>
        </label>
        <div className="grid gap-3 rounded-md border border-white/10 bg-midnight p-4">
          <label className="flex items-center gap-3 text-sm text-mist">
            <input
              type="checkbox"
              checked={showInMenu}
              onChange={(event) => setShowInMenu(event.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Show this page in the main menu
          </label>
          {showInMenu ? (
            <label>
              <span className="label">Menu label</span>
              <input name="menuLabel" defaultValue={page?.menuItems[0]?.label || page?.title || ""} className="input-field" />
            </label>
          ) : null}
        </div>
        {error ? <p className="rounded-md border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="submit" disabled={saving || uploading} className="btn-primary w-fit">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Page"}
        </button>
      </section>

      <aside className="grid h-fit gap-6">


        <section className="rounded-md border border-white/10 bg-obsidian p-5 sm:p-6">
          <h2 className="font-heading text-xl text-mist">Collection Thumbnail</h2>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted mb-4">Visible ONLY in &quot;Explore&quot; menu</p>
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-midnight">
            {collectionImage ? (
              <Image src={collectionImage} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted italic">No collection image</div>
            )}
            {collectionImage ? (
              <button
                type="button"
                onClick={() => setCollectionImage("")}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-white/20 p-4 transition hover:border-gold/50">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("images", file);
                try {
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  const d = await res.json();
                  if (d.urls?.[0]) setCollectionImage(d.urls[0]);
                } catch (err) { console.error(err); }
              }}
            />
            <ImagePlus className="h-4 w-4 text-muted" />
            <span className="text-xs text-muted">Upload collection image</span>
          </label>
        </section>
        
        <section className="rounded-md border border-white/10 bg-obsidian p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="font-heading text-2xl text-mist">Products on this page</h2>
              <p className="mt-1 text-sm text-muted">{productIds.length} selected. Used products can be added here too.</p>
            </div>
            <span className="w-fit rounded-md border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
              {filteredProducts.length} shown
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="relative">
              <span className="sr-only">Search products for this page</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                className="input-field pl-11"
                placeholder="Search product or page..."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="sr-only">Filter products by category</span>
                <select value={productCategory} onChange={(event) => setProductCategory(event.target.value)} className="input-field">
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter products by page status</span>
                <select value={productStatus} onChange={(event) => setProductStatus(event.target.value)} className="input-field">
                  <option value="all">All products</option>
                  <option value="selected">Selected here</option>
                  <option value="not-selected">Not selected here</option>
                  <option value="unassigned">Not on any page</option>
                  <option value="used">Already on other pages</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 grid max-h-[560px] gap-3 overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const checked = selectedProductIds.has(product.id);
              const otherPages = product.pages.filter((linkedPage) => linkedPage.id !== page?.id);
              const image = product.images[0] || "/products/royal-saffron-oud.svg";

              return (
                <label
                  key={product.id}
                  className="grid cursor-pointer grid-cols-[auto_52px_1fr] gap-3 rounded-md border border-white/10 bg-midnight p-3 text-sm text-mist transition hover:border-gold/45"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleProduct(product.id, event.target.checked)}
                    className="mt-4 h-4 w-4 accent-gold"
                  />
                  <span className="relative h-[52px] w-[52px] overflow-hidden rounded-md border border-white/10 bg-charcoal">
                    <Image src={image} alt="" fill className="object-cover" sizes="52px" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-mist">{product.name}</span>
                      {checked ? <span className="rounded-md bg-gold/15 px-2 py-1 text-xs font-bold text-gold">Selected here</span> : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{product.category.name}</span>
                    <span className="mt-2 block text-xs leading-5 text-muted">
                      {product.pages.length ? (
                        <>
                          Already on:{" "}
                          <span className="text-mist">
                            {product.pages.map((linkedPage) => linkedPage.title).join(", ")}
                          </span>
                          {otherPages.length ? " - can also be added here" : null}
                        </>
                      ) : (
                        "Not on any page yet"
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
            {!filteredProducts.length ? (
              <div className="rounded-md border border-white/10 bg-midnight p-5 text-center text-sm text-muted">
                No products match these filters.
              </div>
            ) : null}
          </div>
        </section>
      </aside>
    </form>
  );
}
