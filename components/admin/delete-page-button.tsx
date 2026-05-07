"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePageButton({ pageId, pageTitle }: { pageId: string; pageTitle: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete ${pageTitle}?`)) {
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/pages/${pageId}`, {
      method: "DELETE"
    });
    setLoading(false);

    if (response.ok) {
      router.refresh();
    } else {
      window.alert("Unable to delete page.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="grid h-10 w-10 place-items-center rounded-md text-muted transition hover:bg-red-950/40 hover:text-red-200 disabled:opacity-50"
      aria-label="Delete page"
      title="Delete page"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
