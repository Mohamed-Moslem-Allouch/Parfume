import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, isAdmin = false }: { className?: string; isAdmin?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)} aria-label="Sary Parfume home">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-gold/40 bg-midnight shadow-gold sm:h-11 sm:w-11">
        {isAdmin ? (
          <>
            <span className="absolute inset-0 bg-gold-gradient opacity-90" />
            <span className="relative font-heading text-lg font-bold text-midnight sm:text-xl">S</span>
          </>
        ) : (
          <Image 
            src="/logo.png" 
            alt="Sary Parfume" 
            fill
            className="object-cover"
          />
        )}
      </span>
      <span className="leading-none">
        <span className="block font-heading text-lg font-bold tracking-normal text-mist group-hover:text-gold sm:text-xl">Sary Parfume</span>
        <span className="block text-[10px] uppercase tracking-[0.24em] text-muted sm:text-[11px]">Beauty & Fragrance</span>
      </span>
    </Link>
  );
}
