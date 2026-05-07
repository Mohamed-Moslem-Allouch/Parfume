import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="section-shell grid min-h-[70vh] place-items-center py-16">
      <div className="max-w-xl text-center">
        <SearchX className="mx-auto h-14 w-14 text-gold" />
        <p className="mt-6 text-sm uppercase tracking-[0.24em] text-gold">404</p>
        <h1 className="mt-3 font-heading text-5xl text-mist">This scent trail faded</h1>
        <p className="mt-4 text-muted">The page you are looking for does not exist or has moved.</p>
        <Link href="/shop" className="btn-primary mt-8">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
