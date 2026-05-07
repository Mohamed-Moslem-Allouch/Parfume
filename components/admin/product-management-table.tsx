"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Edit3, Search, Check, Layers, ChevronDown, Trash2, LayoutGrid, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PRODUCT_STATUSES, humanizeStatus } from "@/lib/status";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type PageOption = {
  id: string;
  title: string;
  slug: string;
};

type VisualCategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  stock: number;
  status: string;
  featured: boolean;
  offer?: { active: boolean; type: string; value: number; startsAt: string | null; endsAt: string | null } | null;
  updatedAt: string;
  category: CategoryOption;
  variants: { id: string; name: string; stock: number }[];
  pages: PageOption[];
};

export function ProductManagementTable({
  products,
  categories,
  pages,
  visualCategories = []
}: {
  products: ProductRow[];
  categories: CategoryOption[];
  pages: PageOption[];
  visualCategories?: VisualCategoryOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !term ||
          product.name.toLowerCase().includes(term) ||
          product.slug.toLowerCase().includes(term) ||
          product.category.name.toLowerCase().includes(term) ||
          product.pages.some((page) => page.title.toLowerCase().includes(term));
        const matchesCategory = !categoryId || product.category.id === categoryId;
        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in-stock" && product.stock > 5) ||
          (stockFilter === "low-stock" && product.stock > 0 && product.stock <= 5) ||
          (stockFilter === "out-of-stock" && product.stock <= 0);
        const matchesPage =
          pageFilter === "all" ||
          (pageFilter === "unassigned" && product.pages.length === 0) ||
          product.pages.some((page) => page.id === pageFilter);
        const matchesFeatured =
          featuredFilter === "all" ||
          (featuredFilter === "featured" && product.featured) ||
          (featuredFilter === "normal" && !product.featured);
        const matchesStatus = statusFilter === "all" || product.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStock && matchesPage && matchesFeatured && matchesStatus;
      })
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "price-low") {
          return a.price - b.price;
        }

        if (sort === "price-high") {
          return b.price - a.price;
        }

        if (sort === "stock-low") {
          return a.stock - b.stock;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [categoryId, featuredFilter, pageFilter, products, search, sort, statusFilter, stockFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async (update: any) => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedIds,
          ...update
        })
      });

      // Defensive check for empty response bodies to avoid JSON parsing errors
      const data = response.status !== 204 ? await response.json().catch(() => ({})) : {};

      if (response.ok) {
        setSelectedIds([]);
        router.refresh();
      } else {
        alert(data.message || "Failed to update products");
      }
    } catch (error) {
      console.error("Bulk update failed", error);
      alert("A communication error occurred.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="relative">
      <section className="rounded-md border border-white/10 bg-obsidian">
        <div className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-[minmax(220px,1fr)_150px_140px_160px_140px_140px_150px]">
          <label className="relative">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pl-11" placeholder="Search products..." />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="input-field">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by stock</span>
            <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} className="input-field">
              <option value="all">All stock</option>
              <option value="in-stock">In stock</option>
              <option value="low-stock">Low stock</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by page</span>
            <select value={pageFilter} onChange={(event) => setPageFilter(event.target.value)} className="input-field">
              <option value="all">All pages</option>
              <option value="unassigned">Not on any page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by featured status</span>
            <select value={featuredFilter} onChange={(event) => setFeaturedFilter(event.target.value)} className="input-field">
              <option value="all">All visibility</option>
              <option value="featured">Featured</option>
              <option value="normal">Not featured</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by product status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input-field">
              <option value="all">All statuses</option>
              {PRODUCT_STATUSES.map((item) => (
                <option key={item} value={item}>{humanizeStatus(item)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort products</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="input-field">
              <option value="newest">Recently updated</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price low-high</option>
              <option value="price-high">Price high-low</option>
              <option value="stock-low">Stock low first</option>
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-sm text-muted">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 transition hover:bg-white/10"
            >
              <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? "bg-gold border-gold" : "border-white/20"}`}>
                {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 && <Check className="h-3 w-3 text-black" />}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Select All</span>
            </button>
            <span>
              Showing <strong className="text-mist">{filteredProducts.length}</strong> of <strong className="text-mist">{products.length}</strong> products
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategoryId("");
              setStockFilter("all");
              setPageFilter("all");
              setFeaturedFilter("all");
              setStatusFilter("all");
              setSort("newest");
              setSelectedIds([]);
            }}
            className="rounded-md px-3 py-2 text-gold transition hover:bg-gold/10"
          >
            Clear filters
          </button>
        </div>

        <div className="hidden border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted lg:grid lg:grid-cols-[40px_minmax(280px,1.7fr)_140px_120px_130px_130px_1fr_100px]">
          <span></span>
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
          <span>Stock</span>
          <span>Pages</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/10">
          {filteredProducts.map((product) => {
            const image = product.images[0] || "/products/royal-saffron-oud.svg";
            const isSelected = selectedIds.includes(product.id);

            return (
              <article key={product.id} className={`grid gap-4 p-4 lg:grid-cols-[40px_minmax(280px,1.7fr)_140px_120px_130px_130px_1fr_100px] lg:items-center transition-colors ${isSelected ? "bg-gold/10" : "hover:bg-white/[0.02]"}`}>
                <div className="flex h-10 items-center justify-center">
                  <label className="relative flex cursor-pointer items-center justify-center p-2">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(product.id)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-6 rounded-md border-2 border-white/20 transition-all peer-checked:border-gold peer-checked:bg-gold group-hover:border-gold/50">
                      {isSelected && <Check className="h-5 w-5 text-black" />}
                    </div>
                  </label>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-charcoal">
                    <Image src={image} alt={product.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-mist">{product.name}</p>
                      {product.featured ? <span className="rounded-md bg-gold/15 px-2 py-1 text-xs font-bold text-gold">Featured</span> : null}
                      {product.offer?.active ? <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300">Offer</span> : null}
                    </div>
                    <p className="truncate text-xs text-muted">/{product.slug}</p>
                    <p className="mt-1 text-xs text-muted lg:hidden">{product.category.name}</p>
                  </div>
                </div>

                <p className="text-sm text-muted max-lg:hidden">{product.category.name}</p>
                <p className="text-sm font-bold text-gold">From {formatCurrency(product.price)}</p>
                <StatusBadge value={product.status} type="product" />
                <p className="text-sm text-muted">
                  <span className={product.stock < 5 ? "font-bold text-red-400" : ""}>{product.stock}</span>
                  <span className="ml-2 text-xs text-muted">({product.variants.length} options)</span>
                  {product.stock < 5 && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-red-950/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20">
                      <AlertTriangle className="h-3 w-3" />
                      Low
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  {product.pages.length ? (
                    product.pages.slice(0, 3).map((page) => (
                      <span key={page.id} className="rounded-md bg-white/5 px-2 py-1">
                        {page.title}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md bg-white/5 px-2 py-1">No page</span>
                  )}
                  {product.pages.length > 3 ? <span className="rounded-md bg-white/5 px-2 py-1">+{product.pages.length - 3}</span> : null}
                  <span className="basis-full text-[11px] text-muted">Updated {formatDate(product.updatedAt)}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="grid h-10 w-10 place-items-center rounded-md text-muted transition hover:bg-white/5 hover:text-gold"
                    aria-label={`Edit ${product.name}`}
                    title="Edit product"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                  <DeleteProductButton productId={product.id} productName={product.name} />
                </div>
              </article>
            );
          })}
        </div>

        {!filteredProducts.length ? (
          <div className="px-6 py-16 text-center">
            <p className="font-heading text-2xl text-mist">No products found</p>
            <p className="mt-2 text-sm text-muted">Clear the filters or add a new product.</p>
          </div>
        ) : null}
      </section>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#0f0f0f] flex items-center gap-6 rounded-full px-8 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-3xl">
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] font-black text-black">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold text-mist">Products Selected</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="group relative">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-gold transition-colors py-2">
                  <Check className="h-4 w-4" />
                  Set Status
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute bottom-full left-0 hidden w-48 flex-col rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl group-hover:flex backdrop-blur-xl after:absolute after:bottom-[-20px] after:left-0 after:h-[20px] after:w-full after:content-['']">
                  {PRODUCT_STATUSES.map(status => (
                    <button 
                      key={status}
                      onClick={() => handleBulkUpdate({ status })}
                      className="rounded-lg p-2 text-left text-xs text-mist hover:bg-white/5 transition-colors"
                    >
                      {humanizeStatus(status)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group relative">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-gold transition-colors py-2">
                  <Layers className="h-4 w-4" />
                  Set Category
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute bottom-full left-0 hidden w-48 flex-col rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl group-hover:flex backdrop-blur-xl after:absolute after:bottom-[-20px] after:left-0 after:h-[20px] after:w-full after:content-['']">
                  {categories.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => handleBulkUpdate({ categoryId: c.id })}
                      className="rounded-lg p-2 text-left text-xs text-mist hover:bg-white/5 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group relative">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-gold transition-colors py-2">
                  <LayoutGrid className="h-4 w-4" />
                  Add to Page
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute bottom-full left-0 hidden w-56 flex-col rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl group-hover:flex backdrop-blur-xl after:absolute after:bottom-[-20px] after:left-0 after:h-[20px] after:w-full after:content-['']">
                  {pages.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => handleBulkUpdate({ pageId: p.id, pageAction: "connect" })}
                      className="rounded-lg p-2 text-left text-xs text-mist hover:bg-white/5 transition-colors"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group relative">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-red-400 transition-colors py-2">
                  <X className="h-4 w-4" />
                  Remove from Page
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute bottom-full left-0 hidden w-56 flex-col rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl group-hover:flex backdrop-blur-xl after:absolute after:bottom-[-20px] after:left-0 after:h-[20px] after:w-full after:content-['']">
                  {pages.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => handleBulkUpdate({ pageId: p.id, pageAction: "disconnect" })}
                      className="rounded-lg p-2 text-left text-xs text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="group relative">
                <button 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} products? This cannot be undone.`)) {
                      handleBulkUpdate({ action: "delete" });
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors py-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Products
                </button>
              </div>

              <button 
                onClick={() => setSelectedIds([])}
                className="ml-2 rounded-full bg-white/5 p-2 text-muted hover:bg-white/10 hover:text-mist transition-all"
                title="Cancel selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-black p-6 border border-gold/20 shadow-gold/20 shadow-2xl">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <span className="font-bold text-mist">Updating products...</span>
          </div>
        </div>
      )}
    </div>
  );
}
