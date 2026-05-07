"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/loading-skeletons";
import type { SerializedProduct } from "@/lib/mappers";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductsResponse = {
  products: SerializedProduct[];
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export function ShopProductBrowser({
  pageSlug,
  emptyTitle,
  emptyText
}: {
  pageSlug?: string;
  emptyTitle?: string;
  emptyText?: string;
}) {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialVisualCategory = searchParams.get("visualCategory") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [visualCategory, setVisualCategory] = useState(initialVisualCategory);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const resolvedEmptyTitle = emptyTitle || "No products found";
  const resolvedEmptyText = emptyText || "Try a different search or category.";

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category) {
        params.set("category", category);
      }

      if (visualCategory) {
        params.set("visualCategory", visualCategory);
      }

      if (pageSlug) {
        params.set("pageSlug", pageSlug);
      }

      try {
        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as ProductsResponse;

        setProducts(data.products);
        setCategories(data.categories);
        setPages(data.pagination.pages);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [category, visualCategory, page, pageSlug, search, sort]);

  return (
    <div className="grid gap-8">
      <div className="grid gap-3 rounded-lg border border-white/10 bg-obsidian p-3 sm:p-4 md:grid-cols-[1fr_180px_190px]">
        <label className="relative block">
          <span className="sr-only">Search products...</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="input-field pl-11"
            placeholder="Search products..."
          />
        </label>
        <label>
          <span className="sr-only">All categories</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price low-high</option>
            <option value="price-desc">Price high-low</option>
          </select>
        </label>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-obsidian px-6 py-16 text-center">
          <p className="font-heading text-2xl text-mist">{resolvedEmptyTitle}</p>
          <p className="mt-2 text-sm text-muted">{resolvedEmptyText}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={page <= 1}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-muted transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-muted">
          Page <strong className="text-mist">{page}</strong> of <strong className="text-mist">{pages}</strong>
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(pages, value + 1))}
          disabled={page >= pages}
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-muted transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
