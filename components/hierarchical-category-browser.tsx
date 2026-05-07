"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, LayoutGrid, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string | null;
  children?: Category[];
  pages?: { id: string; title: string; slug: string; collectionImage?: string | null }[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  images?: string[];
  type: string;
  visualCategoryId?: string | null;
};

type HierarchicalCategoryBrowserProps = {
  categories: Category[];
  allProducts: Product[];
  initialCategoryId?: string | null;
};

export function HierarchicalCategoryBrowser({ categories, allProducts, initialCategoryId }: HierarchicalCategoryBrowserProps) {
  // We only show root categories initially
  const roots = useMemo(() => categories.filter(c => !c.parentId), [categories]);
  
  const [history, setHistory] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!initialCategoryId || !categories.length) return;
    const initial = categories.find((category) => category.id === initialCategoryId);
    if (!initial) return;

    const breadcrumb: Category[] = [];
    let currentParentId = initial.parentId;
    while (currentParentId) {
      const parent = categories.find((category) => category.id === currentParentId);
      if (!parent) break;
      breadcrumb.unshift(parent);
      currentParentId = parent.parentId;
    }

    setHistory(breadcrumb);
    setSelectedCategory(initial);
  }, [categories, initialCategoryId]);

  const currentCategories = useMemo(() => {
    if (!selectedCategory) return roots;
    // Find children of selected category
    return categories.filter(c => c.parentId === selectedCategory.id);
  }, [selectedCategory, roots, categories]);

  const currentPages = useMemo(() => selectedCategory?.pages || [], [selectedCategory]);

  const getDescendantIds = useCallback(function collectDescendantIds(categoryId: string): string[] {
    const directChildren = categories.filter((category) => category.parentId === categoryId);
    const directChildIds = directChildren.map((child) => child.id);
    return directChildIds.flatMap((id) => [id, ...collectDescendantIds(id)]);
  }, [categories]);

  const currentProducts = useMemo(() => {
    if (!selectedCategory) return [];
    const scopedIds = new Set([selectedCategory.id, ...getDescendantIds(selectedCategory.id)]);
    return allProducts.filter((product) => product.visualCategoryId && scopedIds.has(product.visualCategoryId));
  }, [selectedCategory, getDescendantIds, allProducts]);

  function handleCategoryClick(category: Category) {
    if (selectedCategory) {
      setHistory([...history, selectedCategory]);
    }
    setSelectedCategory(category);
  }

  function handleBack() {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setSelectedCategory(prev);
    } else {
      setSelectedCategory(null);
    }
  }

  return (
    <div className="section-shell py-12">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted mb-4">
            <button 
              onClick={() => { setSelectedCategory(null); setHistory([]); }}
              className="hover:text-gold transition-colors"
            >
              All Categories
            </button>
            {history.map((cat, i) => (
              <span key={cat.id} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                <button 
                  onClick={() => {
                    const newHistory = history.slice(0, i);
                    setHistory(newHistory);
                    setSelectedCategory(cat);
                  }}
                  className="hover:text-gold transition-colors"
                >
                  {cat.name}
                </button>
              </span>
            ))}
            {selectedCategory && (
              <span className="flex items-center gap-2 text-gold font-bold">
                <ChevronRight className="h-3 w-3" />
                {selectedCategory.name}
              </span>
            )}
          </nav>
          
          <h2 className="font-heading text-4xl text-mist">
            {selectedCategory ? selectedCategory.name : "Choose a Collection"}
          </h2>
        </div>

        {selectedCategory && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-mist hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedCategory?.id || "root"}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-3 grid-cols-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {currentCategories.map((category) => (
            <div 
              key={category.id} 
              onClick={() => handleCategoryClick(category)}
              className="group relative aspect-square sm:aspect-[4/5] overflow-hidden rounded-2xl sm:rounded-[1.5rem] liquid-glass cursor-pointer"
            >
              {category.image ? (
                <Image 
                  src={category.image} 
                  alt={category.name} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal">
                  <LayoutGrid className="h-12 w-12 text-gold/20" />
                </div>
              )}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 sm:p-8 transition-opacity duration-500">
                <h3 className="font-heading text-xs sm:text-2xl text-mist group-hover:text-gold transition-colors">{category.name}</h3>
                <p className="mt-1 text-[10px] sm:text-sm text-muted opacity-0 group-hover:opacity-100 transition-opacity">Explore</p>
              </div>
              <div className="absolute inset-0 specular-highlight opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}

          {currentPages.map((page) => (
            <Link
              key={page.id}
              href={`/${page.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/20 bg-midnight transition-all hover:border-gold"
            >
              {page.collectionImage ? (
                <Image src={page.collectionImage} alt={page.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gold/5 text-[10px] uppercase tracking-wider text-muted">
                  Page
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-3">
                <p className="text-sm font-bold text-gold">{page.title}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted">Collection Page</p>
              </div>
            </Link>
          ))}

          {currentProducts.slice(0, 8).map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-midnight transition hover:border-gold/45"
            >
              <div className="relative aspect-square overflow-hidden bg-charcoal">
                <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-mist group-hover:text-gold">{product.name}</p>
              </div>
            </Link>
          ))}

          {selectedCategory && currentCategories.length === 0 && currentPages.length === 0 && currentProducts.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gold/20 mb-4" />
              <p className="text-muted mb-8">No subcategories, pages, or products found in <span className="text-gold font-bold">{selectedCategory.name}</span>.</p>
              <Link href={`/shop?visualCategory=${selectedCategory.id}`} className="btn-primary">
                View All {selectedCategory.name} Products
              </Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
