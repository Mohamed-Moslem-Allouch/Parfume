"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { AlertTriangle, ImagePlus, Plus, Save, Trash2, Video, X } from "lucide-react";
import type { SerializedProduct } from "@/lib/mappers";
import { PRODUCT_STATUSES, humanizeStatus } from "@/lib/status";

type Category = {
  id: string;
  name: string;
};

type CmsPage = {
  id: string;
  title: string;
  slug: string;
};

type NoteDraft = {
  name: string;
  icon: string;
};

type VariantDraft = {
  name: string;
  price: number;
  stock: number;
  isDefault: boolean;
};

const defaultVariants: VariantDraft[] = [
  { name: "50 ml", price: 0, stock: 0, isDefault: true },
  { name: "100 ml", price: 0, stock: 0, isDefault: false }
];

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const ACCORD_OPTIONS = [
  "sweet", "powdery", "woody", "floral", "aromatic", "citrus",
  "fresh spicy", "animalic", "balsamic", "warm spicy", "green",
  "fresh", "musky", "soft spicy", "fruity", "amber", "earthy",
  "white floral", "vanilla", "rose", "herbal", "patchouli",
  "aldehydic", "lactonic", "aquatic", "smoky", "leather",
  "soapy", "violet", "sour", "coffee", "lavender"
].sort();

const ACCORD_COLORS: Record<string, string> = {
  "sweet": "rgb(238, 54, 59)",
  "powdery": "rgb(238, 221, 204)",
  "woody": "rgb(119, 68, 20)",
  "floral": "rgb(255, 95, 141)",
  "aromatic": "rgb(55, 160, 137)",
  "citrus": "rgb(249, 255, 82)",
  "fresh spicy": "rgb(131, 201, 40)",
  "animalic": "rgb(142, 75, 19)",
  "balsamic": "rgb(173, 131, 89)",
  "warm spicy": "rgb(204, 51, 0)",
  "green": "rgb(14, 140, 29)",
  "fresh": "rgb(155, 229, 237)",
  "musky": "rgb(231, 216, 234)",
  "soft spicy": "rgb(226, 119, 82)",
  "fruity": "rgb(252, 75, 41)",
  "amber": "rgb(188, 77, 16)",
  "earthy": "rgb(84, 72, 56)",
  "white floral": "rgb(237, 242, 251)",
  "vanilla": "rgb(255, 254, 192)",
  "rose": "rgb(254, 1, 107)",
  "herbal": "rgb(108, 164, 127)",
  "patchouli": "rgb(99, 101, 46)",
  "aldehydic": "rgb(216, 233, 246)",
  "lactonic": "rgb(251, 249, 242)",
  "aquatic": "rgb(99, 204, 226)",
  "smoky": "rgb(130, 116, 135)",
  "leather": "rgb(120, 72, 58)",
  "soapy": "rgb(227, 246, 252)",
  "violet": "rgb(156, 29, 255)",
  "sour": "rgb(192, 231, 65)",
  "coffee": "rgb(84, 56, 30)",
  "lavender": "rgb(175, 155, 205)"
};

export function ProductForm({
  categories,
  visualCategories,
  pages,
  product
}: {
  categories: any[];
  visualCategories: any[];
  pages: CmsPage[];
  product?: any;
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [videos, setVideos] = useState<string[]>(product?.videos || []);
  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants.length
      ? product.variants.map((variant: any, index: number) => ({
          name: variant.name,
          price: variant.price,
          stock: variant.stock,
          isDefault: variant.isDefault || index === 0
        }))
      : defaultVariants
  );
  const [topNotes, setTopNotes] = useState<NoteDraft[]>(product?.topNotes || []);
  const [heartNotes, setHeartNotes] = useState<NoteDraft[]>(product?.heartNotes || []);
  const [baseNotes, setBaseNotes] = useState<NoteDraft[]>(product?.baseNotes || []);
  const [accords, setAccords] = useState<{ name: string; value: number }[]>(product?.accords || []);
  const [type, setType] = useState<"PERFUME" | "REGULAR">((product?.type as "PERFUME" | "REGULAR") || "PERFUME");
  const [status, setStatus] = useState<string>(product?.status || "ACTIVE");
  const [offerType, setOfferType] = useState<"PERCENTAGE" | "FIXED">((product?.offer?.type as "PERCENTAGE" | "FIXED") || "PERCENTAGE");
  const [offerValue, setOfferValue] = useState<string>(product?.offer?.value ? String(product.offer.value) : "");
  const [offerStart, setOfferStart] = useState<string>(toDatetimeLocal(product?.offer?.startsAt));
  const [offerEnd, setOfferEnd] = useState<string>(toDatetimeLocal(product?.offer?.endsAt));
  const [pageIds, setPageIds] = useState<string[]>(product?.pageIds || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalStock = useMemo(() => variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0), [variants]);
  const minPrice = useMemo(
    () => Math.min(...variants.filter((variant) => Number(variant.price) > 0).map((variant) => Number(variant.price))),
    [variants]
  );

  async function handleUpload(event: ChangeEvent<HTMLInputElement>, kind: "images" | "videos") {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append(kind, file));
    setUploading(true);
    setError("");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { urls?: string[]; message?: string };

      if (!response.ok || !data.urls) {
        throw new Error(data.message || "Unable to upload files.");
      }

      if (kind === "images") {
        setImages((current) => [...current, ...data.urls!].slice(0, 16));
      } else {
        setVideos((current) => [...current, ...data.urls!].slice(0, 8));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload files.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, candidateIndex) =>
        candidateIndex === index
          ? {
              ...variant,
              ...patch
            }
          : patch.isDefault
            ? { ...variant, isDefault: false }
            : variant
      )
    );
  }

  function removeVariant(index: number) {
    setVariants((current) => {
      const next = current.filter((_, candidateIndex) => candidateIndex !== index);

      if (!next.some((variant) => variant.isDefault) && next[0]) {
        next[0].isDefault = true;
      }

      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    let validVariants = variants
      .map((variant) => ({
        ...variant,
        name: variant.name.trim(),
        price: Number(variant.price),
        stock: Number(variant.stock)
      }))
      .filter((variant) => variant.name && variant.price > 0);

    if (type === "REGULAR") {
      validVariants = [validVariants[0] || { name: "Standard", price: 0, stock: 0, isDefault: true }];
    }

    if (!validVariants.length) {
      setSaving(false);
      setError("Add at least one size or option with a valid price.");
      return;
    }

    if (!validVariants.some((variant) => variant.isDefault)) {
      validVariants[0].isDefault = true;
    }

    const payload = {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      categoryId: String(formData.get("categoryId") || ""),
      status,
      offerType: offerValue ? offerType : null,
      offerValue: offerValue ? Number(offerValue) : null,
      offerStart: offerValue && offerStart ? offerStart : null,
      offerEnd: offerValue && offerEnd ? offerEnd : null,
      featured: formData.get("featured") === "on",
      bestSeller: formData.get("bestSeller") === "on",
      isNew: formData.get("isNew") === "on",
      images,
      videos,
      variants: validVariants,
      topNotes,
      heartNotes,
      baseNotes,
      accords,
      type,
      pageIds,
      visualCategoryId: String(formData.get("visualCategoryId") || "") || null
    };

    try {
      const response = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
        method: product ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Unable to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="xl:col-span-2 rounded-lg border border-gold/20 bg-gold/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{product ? "Edit product" : "Add new product"}</p>
            <h2 className="mt-2 font-heading text-3xl text-mist">Product setup</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Work from left to right: define what the customer sees, set the price and stock, upload media, then add perfume details and visibility.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5 lg:min-w-[520px]">
            <WorkflowPill step="1" label="Basics" />
            <WorkflowPill step="2" label="Pricing" />
            <WorkflowPill step="3" label="Media" />
            <WorkflowPill step="4" label="Scent" />
            <WorkflowPill step="5" label="Visibility" />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="grid gap-6 rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
          <SectionHeader
            step="1"
            title="Product basics"
            description="Start with the product type, name, description, category, and storefront status."
          />

          <div>
            <span className="label">Product Type</span>
            <div className="mt-2 flex gap-4">
              <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition ${type === 'PERFUME' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-midnight text-muted hover:border-white/20'}`}>
                <input type="radio" className="sr-only" checked={type === 'PERFUME'} onChange={() => setType('PERFUME')} />
                <span className="font-bold">Perfume</span>
              </label>
              <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-4 transition ${type === 'REGULAR' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-midnight text-muted hover:border-white/20'}`}>
                <input 
                  type="radio" 
                  className="sr-only" 
                  checked={type === 'REGULAR'} 
                  onChange={() => {
                    setType('REGULAR');
                    setVariants(prev => [prev[0] || { name: "Standard", price: 0, stock: 0, isDefault: true }]);
                  }} 
                />
                <span className="font-bold">Other Product</span>
              </label>
            </div>
          </div>

          <label>
            <span className="label">Name</span>
            <input name="name" defaultValue={product?.name} required minLength={2} className="input-field" />
          </label>
          <label>
            <span className="label">Description</span>
            <textarea
              name="description"
              defaultValue={product?.description}
              required
              minLength={10}
              rows={8}
              className="input-field resize-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Category (Default)</span>
              <select name="categoryId" defaultValue={product?.category.id || categories[0]?.id} required className="input-field">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Collection (Visual Hierarchy)</span>
              <select name="visualCategoryId" defaultValue={product?.visualCategoryId || ""} className="input-field">
                <option value="">None (Not in visual collections)</option>
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
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <label>
              <span className="label">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-field">
                {PRODUCT_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {humanizeStatus(item)}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-gold/20 bg-gold/10 p-4 text-sm leading-6 text-muted">
              Active products are visible in the store. Draft and archived products stay hidden from customer pages.
            </div>
          </div>

          <SectionHeader
            step="2"
            title="Pricing, inventory, and offer"
            description="Set the selling price, stock level, and any time-limited discount."
          />

          <div className="rounded-lg border border-white/10 bg-midnight p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-heading text-xl text-mist">Timed offer</h2>
                <p className="mt-1 text-sm text-muted">Add a fixed or percentage discount with optional start and end dates.</p>
              </div>
              {product?.offer?.active ? (
                <span className="rounded-full border border-gold/30 bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
                  Active now
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[160px_140px_1fr_1fr]">
              <label>
                <span className="label">Discount</span>
                <select value={offerType} onChange={(event) => setOfferType(event.target.value as "PERCENTAGE" | "FIXED")} className="input-field">
                  <option value="PERCENTAGE">Percent</option>
                  <option value="FIXED">Fixed TND</option>
                </select>
              </label>
              <label>
                <span className="label">Value</span>
                <input
                  type="number"
                  min="0"
                  max={offerType === "PERCENTAGE" ? 100 : undefined}
                  step="0.001"
                  value={offerValue}
                  onChange={(event) => setOfferValue(event.target.value)}
                  placeholder={offerType === "PERCENTAGE" ? "15" : "10"}
                  className="input-field"
                />
              </label>
              <label>
                <span className="label">Starts</span>
                <input type="datetime-local" value={offerStart} onChange={(event) => setOfferStart(event.target.value)} className="input-field" />
              </label>
              <label>
                <span className="label">Ends</span>
                <input type="datetime-local" value={offerEnd} onChange={(event) => setOfferEnd(event.target.value)} className="input-field" />
              </label>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-midnight p-4">
              <p className="text-sm text-muted">{type === 'PERFUME' ? 'Computed catalog values' : 'Quick inventory'}</p>
              <p className="mt-2 text-sm text-mist">
                {type === 'PERFUME' ? (
                  <>From <span className="font-bold text-gold">{Number.isFinite(minPrice) ? `${minPrice} TND` : "0 TND"}</span> · {totalStock} units</>
                ) : (
                  <><span className="font-bold text-gold">{variants[0]?.price || 0} TND</span> · {variants[0]?.stock || 0} units</>
                )}
              </p>
            </div>


          {type === 'REGULAR' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="label">Price TND</span>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={variants[0]?.price || 0}
                  onChange={(e) => updateVariant(0, { price: Number(e.target.value), name: "Standard", isDefault: true })}
                  className="input-field"
                />
              </label>
              <label>
                <span className="label">Stock Units</span>
                <input
                  type="number"
                  min="0"
                  value={variants[0]?.stock || 0}
                  onChange={(e) => updateVariant(0, { stock: Number(e.target.value), name: "Standard", isDefault: true })}
                  className="input-field"
                />
              </label>
            </div>
          )}

          <SectionHeader
            step="3"
            title="Customer-facing badges"
            description="Highlight items that should stand out while customers browse."
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-midnight p-4 text-sm text-mist">
              <input name="featured" type="checkbox" defaultChecked={product?.featured} className="h-4 w-4 accent-gold" />
              Featured
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-midnight p-4 text-sm text-mist">
              <input name="bestSeller" type="checkbox" defaultChecked={product?.bestSeller} className="h-4 w-4 accent-gold" />
              Best Seller
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-midnight p-4 text-sm text-mist">
              <input name="isNew" type="checkbox" defaultChecked={product?.isNew} className="h-4 w-4 accent-gold" />
              New Arrival
            </label>
          </div>
        </section>

        {type === 'PERFUME' && (
          <>
            <section className="rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <SectionHeader
                  step="4"
                  title="Sizes and options"
                  description="Create 50 ml, 100 ml, testers, gift sets, or any custom option."
                />
                <button
                  type="button"
                  onClick={() => setVariants((current) => [...current, { name: "", price: 0, stock: 0, isDefault: false }])}
                  className="btn-secondary shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                {variants.map((variant, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border border-white/10 bg-midnight p-4 md:grid-cols-[1fr_130px_120px_110px_44px]">
                    <label>
                      <span className="label">Option</span>
                      <input
                        value={variant.name}
                        onChange={(event) => updateVariant(index, { name: event.target.value })}
                        placeholder="50 ml"
                        className="input-field"
                      />
                    </label>
                    <label>
                      <span className="label">Price TND</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={variant.price}
                        onChange={(event) => updateVariant(index, { price: Number(event.target.value) })}
                        className="input-field"
                      />
                    </label>
                    <label>
                      <span className="label">Stock</span>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })}
                        className={`input-field ${variant.stock < 5 ? "border-red-500/50" : ""}`}
                      />
                      {variant.stock < 5 && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </div>
                      )}
                    </label>
                    <label className="flex items-end gap-2 pb-3 text-sm text-muted">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={variant.isDefault}
                        onChange={() => updateVariant(index, { isDefault: true })}
                        className="h-4 w-4 accent-gold"
                      />
                      Default
                    </label>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      disabled={variants.length <= 1}
                      className="mt-auto grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-red-950/40 hover:text-red-200 disabled:opacity-40"
                      aria-label="Remove option"
                      title="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
              <SectionHeader
                step="5"
                title="Perfume pyramid"
                description="Define the olfactory notes for the Fragrantica-style pyramid."
              />

              <div className="mt-8 space-y-10">
                <NotesEditor 
                  title="The Ascension" 
                  subtitle="Top Notes" 
                  notes={topNotes} 
                  setNotes={setTopNotes} 
                />
                <NotesEditor 
                  title="The Soul" 
                  subtitle="Heart Notes" 
                  notes={heartNotes} 
                  setNotes={setHeartNotes} 
                />
                <NotesEditor 
                  title="The Eternity" 
                  subtitle="Base Notes" 
                  notes={baseNotes} 
                  setNotes={setBaseNotes} 
                />
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <SectionHeader
                  step="6"
                  title="Main accords"
                  description="Create the fragrance profile bars seen on the product page."
                />
                <button
                  type="button"
                  onClick={() => setAccords((current) => [...current, { name: ACCORD_OPTIONS[0], value: 100 }])}
                  className="btn-secondary shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Accord
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                {accords.map((accord, index) => {
                  const color = ACCORD_COLORS[accord.name.toLowerCase()] || "rgb(150, 150, 150)";
                  const isLight = ["citrus", "soapy", "white floral", "vanilla", "powdery", "lavender", "fresh", "aquatic"].includes(accord.name.toLowerCase());

                  return (
                    <div key={index} className="grid items-center gap-3 rounded-lg border border-white/10 bg-midnight p-4 sm:grid-cols-[1fr_120px_44px]">
                      <div className="flex flex-col gap-2">
                        <span className="label">Accord Profile</span>
                        <div 
                          className="flex h-11 items-center justify-center rounded-md px-4 shadow-inner transition-colors duration-500"
                          style={{ backgroundColor: color }}
                        >
                          <select
                            value={accord.name}
                            onChange={(e) => {
                              const next = [...accords];
                              next[index].name = e.target.value;
                              setAccords(next);
                            }}
                            className={`w-full bg-transparent text-center font-bold uppercase tracking-widest outline-none ${
                              isLight ? "text-black/70" : "text-white"
                            }`}
                          >
                            {ACCORD_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-obsidian text-mist">{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <label>
                        <span className="label">Value %</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={accord.value}
                          onChange={(e) => {
                            const next = [...accords];
                            next[index].value = Number(e.target.value);
                            setAccords(next);
                          }}
                          className="input-field"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setAccords(accords.filter((_, i) => i !== index))}
                        className="mt-6 grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-red-950/40 hover:text-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                {accords.length === 0 && (
                  <p className="py-4 text-center text-sm italic text-muted">No accords added. Add one to show the fragrance profile.</p>
                )}
              </div>
            </section>
          </>
        )}

        <section className="rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
          <SectionHeader
            step="7"
            title="Page visibility"
            description="Choose which custom pages should display this product."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {pages.length ? (
              pages.map((page) => (
                <label key={page.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-midnight p-4 text-sm text-mist">
                  <input
                    type="checkbox"
                    checked={pageIds.includes(page.id)}
                    onChange={(event) =>
                      setPageIds((current) =>
                        event.target.checked ? [...current, page.id] : current.filter((id) => id !== page.id)
                      )
                    }
                    className="h-4 w-4 accent-gold"
                  />
                  <span>
                    {page.title}
                    <span className="block text-xs text-muted">/{page.slug}</span>
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted">Create custom pages first, then assign products to them.</p>
            )}
          </div>
        </section>

        {error ? <p className="rounded-lg border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="submit" disabled={saving || uploading || !categories.length} className="btn-primary w-fit">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      <aside className="grid h-fit gap-6">
        <section className="rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
          <SectionHeader
            step="3"
            title="Product images"
            description="Upload up to 16 images. Use clear product photos first, then detail or lifestyle shots."
          />
          <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gold/35 bg-midnight p-5 text-center text-sm text-muted transition hover:border-gold hover:text-mist">
            <ImagePlus className="mb-2 h-6 w-6 text-gold" />
            {uploading ? "Uploading..." : "Choose images"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/svg+xml" multiple onChange={(event) => handleUpload(event, "images")} className="sr-only" disabled={uploading} />
          </label>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-charcoal">
                <Image src={image} alt="Product upload preview" fill className="object-cover" sizes="160px" />
                <button
                  type="button"
                  onClick={() => setImages((current) => current.filter((item) => item !== image))}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove image"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-obsidian p-5 sm:p-6">
          <SectionHeader
            step="3"
            title="Product videos"
            description="Upload MP4, WebM, or MOV videos. Keep them short and focused on the product."
          />
          <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gold/35 bg-midnight p-5 text-center text-sm text-muted transition hover:border-gold hover:text-mist">
            <Video className="mb-2 h-6 w-6 text-gold" />
            {uploading ? "Uploading..." : "Choose videos"}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={(event) => handleUpload(event, "videos")} className="sr-only" disabled={uploading} />
          </label>
          <div className="mt-5 grid gap-3">
            {videos.map((video) => (
              <div key={video} className="group relative overflow-hidden rounded-lg border border-white/10 bg-charcoal">
                <video src={video} controls className="aspect-video w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setVideos((current) => current.filter((item) => item !== video))}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove video"
                  title="Remove video"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </form>
  );
}

function NotesEditor({
  title,
  subtitle,
  notes,
  setNotes
}: {
  title: string;
  subtitle: string;
  notes: NoteDraft[];
  setNotes: (notes: NoteDraft[]) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg text-gold">{title}</h3>
          <p className="text-xs uppercase tracking-wider text-muted">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setNotes([...notes, { name: "", icon: "" }])}
          className="btn-secondary h-8 px-3 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Note
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((note, index) => (
          <div key={index} className="flex items-center gap-4 rounded-lg border border-white/10 bg-midnight p-3 transition-colors hover:border-gold/30">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-charcoal bg-charcoal ring-1 ring-gold/30">
              {note.icon ? (
                <Image src={note.icon} alt="Preview" fill sizes="64px" className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[10px] text-muted">No Icon</div>
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <label>
                <span className="text-[10px] uppercase tracking-wider text-muted">Note Name</span>
                <input
                  value={note.name}
                  onChange={(e) => {
                    const next = [...notes];
                    next[index].name = e.target.value;
                    setNotes(next);
                  }}
                  placeholder="e.g. Bergamot"
                  className="input-field h-8 text-sm"
                />
              </label>
              <label>
                <span className="text-[10px] uppercase tracking-wider text-muted">Icon URL</span>
                <input
                  value={note.icon}
                  onChange={(e) => {
                    const next = [...notes];
                    next[index].icon = e.target.value;
                    setNotes(next);
                  }}
                  placeholder="URL to icon image"
                  className="input-field h-8 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setNotes(notes.filter((_, i) => i !== index))}
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-red-950/40 hover:text-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="col-span-full py-4 text-center text-xs italic text-muted">No notes added yet.</p>
        )}
      </div>
    </div>
  );
}

function WorkflowPill({ step, label }: { step: string; label: string }) {
  return (
    <div className="rounded-md border border-gold/20 bg-black/20 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gold">Step {step}</p>
      <p className="mt-1 font-semibold text-mist">{label}</p>
    </div>
  );
}

function SectionHeader({
  step,
  title,
  description
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold">Step {step}</p>
        <h2 className="mt-1 font-heading text-2xl text-mist">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}
