"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MediaItem = {
  type: "image" | "video";
  url: string;
};

export function ProductGallery({ images, videos = [], name }: { images: string[]; videos?: string[]; name: string }) {
  const safeImages = images.length ? images : ["/products/royal-saffron-oud.svg"];
  const media: MediaItem[] = [
    ...safeImages.map((url) => ({ type: "image" as const, url })),
    ...videos.map((url) => ({ type: "video" as const, url }))
  ];
  const [active, setActive] = useState(media[0]);

  return (
    <div className="grid gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-white/10 bg-charcoal">
        {active.type === "image" ? (
          <Image src={active.url} alt={name} fill priority className="object-cover" sizes="(min-width: 1024px) 48vw, 100vw" />
        ) : (
          <video src={active.url} controls className="h-full w-full object-cover" />
        )}
      </div>
      {media.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {media.map((item) => (
            <button
              key={item.url}
              type="button"
              onClick={() => setActive(item)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border bg-charcoal",
                active.url === item.url ? "border-gold" : "border-white/10"
              )}
              aria-label={`View ${name} image`}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt={name} fill className="object-cover" sizes="96px" />
              ) : (
                <span className="grid h-full w-full place-items-center text-xs font-bold text-gold">VIDEO</span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
