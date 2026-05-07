"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete ${productName}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/products/${productId}`, {
      method: "DELETE"
    });
    setLoading(false);

    if (response.ok) {
      router.refresh();
    } else {
      window.alert("Unable to delete product.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="grid h-10 w-10 place-items-center rounded-md text-muted transition hover:bg-red-950/40 hover:text-red-200 disabled:opacity-50"
      aria-label="Delete product"
      title="Delete product"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
