"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { storeConfig } from "@/lib/store";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

export function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--bg-tertiary)', borderTopColor: 'var(--border)' }} className="border-t no-print" suppressHydrationWarning>
      <div className="section-shell grid gap-10 py-12 md:grid-cols-[1.2fr_.8fr_.8fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-md text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            Premium perfumes, body care, oils, and beauty products selected for depth, elegance, and quality.
          </p>
        </div>
        <div>
          <h3 className="font-heading text-lg text-gold">Visit</h3>
          <div className="mt-4 space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{storeConfig.address}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{storeConfig.phone}</span>
            </p>
            <p className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{storeConfig.email}</span>
            </p>
          </div>
        </div>
        <div>
          <h3 className="font-heading text-lg text-gold">Follow</h3>
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="https://instagram.com"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              className="grid h-10 w-10 place-items-center rounded-md border transition hover:border-gold hover:text-gold"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon className="h-4 w-4" />
            </Link>
            <Link
              href="https://facebook.com"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              className="grid h-10 w-10 place-items-center rounded-md border transition hover:border-gold hover:text-gold"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FacebookIcon className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs" style={{ color: 'var(--text-secondary)' }}>Copyright {new Date().getFullYear()} {storeConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
