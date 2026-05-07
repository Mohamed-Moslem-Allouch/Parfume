"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

type VisualCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parentId: string | null;
  children?: VisualCategory[];
  pages?: { id: string; title: string; slug: string; collectionImage?: string | null }[];
};

export function VisualMenuDropdown({ categories, isMobileMenu }: { categories: VisualCategory[]; isMobileMenu?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoot, setActiveRoot] = useState<VisualCategory | null>(null);
  const [trail, setTrail] = useState<VisualCategory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  const roots = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  /** Top-level root for the current drill position (for left-rail highlight). */
  const getTopRootFor = useCallback((category: VisualCategory | null): VisualCategory | null => {
    if (!category) return null;
    let current: VisualCategory | null = category;
    while (current?.parentId) {
      const parent = categoryById.get(current.parentId);
      if (!parent) break;
      current = parent;
    }
    return current;
  }, [categoryById]);

  const sidebarHighlightedRoot = useMemo(
    () => getTopRootFor(activeRoot),
    [activeRoot, getTopRootFor]
  );

  /** Full path for breadcrumb: Niche → SlouuMa → mmm */
  const pathChain = useMemo(() => (activeRoot ? [...trail, activeRoot] : []), [trail, activeRoot]);

  function jumpToPathIndex(index: number) {
    if (!pathChain.length || index < 0 || index >= pathChain.length) return;
    const target = pathChain[index];
    setActiveRoot(target);
    setTrail(pathChain.slice(0, index));
  }

  function drillInto(category: VisualCategory) {
    if (!activeRoot) {
      setActiveRoot(category);
      return;
    }

    if (activeRoot.id === category.id) {
      window.location.href = `/collections?collection=${category.id}`;
      return;
    }

    setTrail((current) => [...current, activeRoot]);
    setActiveRoot(category);
  }

  function goBackLevel() {
    if (!trail.length) return;
    const previous = trail[trail.length - 1];
    setTrail((current) => current.slice(0, -1));
    setActiveRoot(previous);
  }

  // When Explore opens, start at first root (same as a fresh home browse).
  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (justOpened && roots.length > 0) {
      setActiveRoot(roots[0]);
      setTrail([]);
    }
    if (!isOpen) {
      prevOpenRef.current = false;
    }
  }, [isOpen, roots]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md transition hover:bg-white/5 hover:text-mist",
          isMobileMenu ? "w-full justify-between py-1.5 text-xs font-bold text-gold" : "px-5 py-3 text-base font-bold text-muted",
          isOpen && "bg-white/5 text-gold"
        )}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" />
          Explore
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ backgroundColor: 'var(--surface-solid)', borderColor: 'var(--border)' }}
            className={cn(
              "mt-4 overflow-y-auto max-h-[85vh] rounded-[2.5rem] border shadow-2xl backdrop-blur-2xl z-[80] no-scrollbar",
              isMobileMenu
                ? "relative w-full p-2"
                : "fixed top-18 left-[40%] -translate-x-1/2 w-[650px] p-8 max-h-[85vh] overflow-y-auto rounded-[1.5rem] border shadow-2xl backdrop-blur-2xl z-[80]"
            )}
            suppressHydrationWarning
          >
            <div className={cn(
              "grid gap-6 sm:gap-8",
              isMobileMenu ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[1fr_2fr]"
            )}>
              {/* Left Side: Root Categories */}
              <div className={cn(
                "space-y-4 border-white/5",
                isMobileMenu ? "border-b" : "border-b sm:border-b-0 sm:border-r pb-4 sm:pb-0 sm:pr-8"
              )}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">Collections</p>
                <div className="flex sm:grid gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[400px] pb-2 sm:pb-0 no-scrollbar">
                  {roots.map(root => (
                    <button
                      key={root.id}
                      onClick={() => {
                        setTrail([]);
                        setActiveRoot(root);
                      }}
                      onMouseEnter={() => {
                        if (window.innerWidth > 640) {
                          setTrail([]);
                          setActiveRoot(root);
                        }
                      }}
                      className={cn(
                        "flex shrink-0 sm:w-full items-center justify-between rounded-xl p-3 text-left transition-all",
                        sidebarHighlightedRoot?.id === root.id ? "bg-white/5 text-gold" : "hover:bg-white/[0.02]"
                      )}
                    >
                      <span className="font-bold text-xs sm:text-base whitespace-nowrap sm:whitespace-normal">{root.name}</span>
                      <ChevronRight className="h-4 w-4 opacity-40 hidden sm:block" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side: Visual Sub-cards */}
              <div className="min-h-[350px] sm:max-h-[500px] sm:overflow-y-auto no-scrollbar">
                {activeRoot ? (
                  <div key={activeRoot.id} className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold/60">Explore</p>
                    <nav
                      className="mb-4 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] font-semibold text-muted"
                      aria-label="Collection path"
                    >
                      {pathChain.map((segment, index) => (
                        <span key={segment.id} className="inline-flex items-center gap-1">
                          {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 opacity-50" /> : null}
                          {index === pathChain.length - 1 ? (
                            <span className="text-gold">{segment.name}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => jumpToPathIndex(index)}
                              className="rounded-md px-1 py-0.5 text-mist transition hover:bg-white/5 hover:text-gold"
                            >
                              {segment.name}
                            </button>
                          )}
                        </span>
                      ))}
                    </nav>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                        {trail.length ? `${trail.length + 1} levels deep` : "Top collection"}
                      </p>
                      {trail.length ? (
                        <button
                          onClick={goBackLevel}
                          className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold transition hover:text-mist"
                        >
                          Back one level
                        </button>
                      ) : null}
                    </div>

                    {/* Grid for Children (Sub-categories) and Pages */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Sub-categories */}
                      {activeRoot.children?.map(child => (
                        <button
                          key={child.id}
                          onClick={() => drillInto(child)}
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                          className="group relative aspect-[4/5] overflow-hidden rounded-2xl border transition-all hover:border-gold/50"
                        >
                          {child.image ? (
                            <Image src={child.image} alt={child.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }} className="flex h-full w-full items-center justify-center text-[10px] uppercase">No Img</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 p-3">
                            <p style={{ color: 'var(--text-heading)' }} className="text-sm font-bold">{child.name}</p>
                            <p className="text-[9px] uppercase tracking-wider text-gold/60">Collection (click to open)</p>
                          </div>
                        </button>
                      ))}

                      {/* Pages associated with this collection */}
                      {activeRoot.pages?.map(page => (
                        <Link
                          key={page.id}
                          href={`/${page.slug}`}
                          onClick={() => setIsOpen(false)}
                          style={{ backgroundColor: 'var(--card-bg)' }}
                          className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/20 transition-all hover:border-gold"
                        >
                          {page.collectionImage ? (
                            <Image src={page.collectionImage} alt={page.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gold/5 opacity-40 transition-opacity group-hover:opacity-60" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 p-3">
                            <p className="text-sm font-bold text-gold">{page.title}</p>
                            <p className="text-[9px] uppercase tracking-wider text-muted">Feature Page</p>
                          </div>
                        </Link>
                      ))}

                      {/* Fallback if empty */}
                      {(!activeRoot.children?.length && !activeRoot.pages?.length) && (
                        <div className="col-span-2 flex flex-col items-center justify-center pt-12 text-center">
                          <div style={{ borderColor: 'var(--border)' }} className="relative mb-4 aspect-square w-32 overflow-hidden rounded-2xl border">
                            {activeRoot.image ? (
                              <Image src={activeRoot.image} alt="" fill className="object-cover" />
                            ) : (
                              <div style={{ backgroundColor: 'var(--bg-secondary)' }} className="h-full w-full" />
                            )}
                          </div>
                          <p className="mb-6 text-sm text-muted italic">Direct view available</p>
                          <Link
                            href={`/shop?visualCategory=${activeRoot.id}`}
                            onClick={() => setIsOpen(false)}
                            className="btn-primary py-2 text-xs"
                          >
                            View Products
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <p className="text-sm text-muted italic">Select a collection to explore visually</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
