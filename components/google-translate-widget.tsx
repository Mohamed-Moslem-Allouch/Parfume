"use client";

import Script from "next/script";
import { Languages, Loader2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          element: string
        ) => void;
      };
    };
  }
}

export function GoogleTranslateWidget() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "translating" | "done" | "error">("idle");
  const restrictedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/thank-you");

  useEffect(() => {
    const saved = window.localStorage.getItem("google-translate-enabled") === "true";

    if (restrictedPath) {
      const wasTranslated = saved || hasTranslateCookie() || isTranslatedDocument();
      window.localStorage.removeItem("google-translate-enabled");
      clearTranslateCookies();
      removeGoogleTranslateOverlays();
      setEnabled(false);
      setReady(false);
      setOpen(false);

      if (wasTranslated) {
        window.location.reload();
      }

      return;
    }

    setEnabled(saved);
    if (!saved) {
      clearTranslateCookies();
      removeGoogleTranslateOverlays();
    }
  }, [restrictedPath]);

  useEffect(() => {
    const cleanup = () => removeGoogleTranslateOverlays();
    cleanup();

    const observer = new MutationObserver(cleanup);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(cleanup, 600);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          layout: 0
        },
        "google_translate_element"
      );
      setReady(true);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, [enabled]);

  useEffect(() => {
    if (!ready) return;

    let select: HTMLSelectElement | null = null;
    const handleChange = () => {
      if (!select?.value) return;

      setStatus("translating");
      window.setTimeout(() => {
        setStatus("done");
        setOpen(false);
        window.setTimeout(() => setStatus("idle"), 900);
      }, 1800);
    };

    const interval = window.setInterval(() => {
      select = document.querySelector<HTMLSelectElement>("#google_translate_element select.goog-te-combo");
      if (!select) return;
      select.addEventListener("change", handleChange);
      window.clearInterval(interval);
    }, 250);

    return () => {
      window.clearInterval(interval);
      select?.removeEventListener("change", handleChange);
    };
  }, [ready]);

  function enableTranslator() {
    window.localStorage.setItem("google-translate-enabled", "true");
    setEnabled(true);
    setOpen(true);
  }

  function disableTranslator() {
    window.localStorage.removeItem("google-translate-enabled");
    clearTranslateCookies();
    removeGoogleTranslateOverlays();
    window.location.reload();
  }

  if (restrictedPath) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 z-[80]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-11 w-11 place-items-center rounded-full border border-gold/30 bg-obsidian/95 text-gold shadow-2xl backdrop-blur-xl transition hover:border-gold"
        aria-label="Translate website"
      >
        <Languages className="h-5 w-5" />
      </button>

      <div
        className={`absolute bottom-14 left-0 w-[min(18rem,calc(100vw-2rem))] rounded-md border border-white/10 bg-obsidian/95 p-3 shadow-2xl backdrop-blur-xl transition ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gold">
            <Languages className="h-4 w-4" />
            Translate
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-muted transition hover:text-mist" aria-label="Close translator">
            <X className="h-4 w-4" />
          </button>
        </div>
        {enabled ? (
          <>
            <div id="google_translate_element" className="min-h-8 min-w-40 text-sm" />
            {!ready && status !== "error" ? <p className="text-xs text-muted">Preparing translator...</p> : null}
            {status === "translating" ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-gold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Translating...
              </p>
            ) : null}
            {status === "error" ? <p className="mt-2 text-xs text-red-400">Translator unavailable.</p> : null}
            <button type="button" onClick={disableTranslator} className="mt-3 w-full rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-muted transition hover:text-mist">
              Turn off translation
            </button>
          </>
        ) : (
          <div className="grid gap-3">
            <p className="text-xs leading-5 text-muted">Google Translate is off by default.</p>
            <button type="button" onClick={enableTranslator} className="btn-primary px-4 py-2 text-xs">
              Enable Google Translate
            </button>
          </div>
        )}
      </div>

      {enabled ? (
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
          onError={() => setStatus("error")}
        />
      ) : null}
    </div>
  );
}

function removeGoogleTranslateOverlays() {
  document
    .querySelectorAll(
      [
        "#goog-gt-tt",
        "body > .skiptranslate",
        "iframe.skiptranslate",
        ".goog-te-banner-frame",
        ".goog-te-balloon-frame",
        ".VIpgJd-ZVi9od-aZ2wEe-wOHMyf",
        ".VIpgJd-ZVi9od-aZ2wEe-OiiCO",
        ".VIpgJd-ZVi9od-ORHb-OEVmcd"
      ].join(", ")
    )
    .forEach((node) => node.remove());
  document.body.style.top = "0px";
}

function isTranslatedDocument() {
  return document.documentElement.classList.contains("translated-ltr") || document.documentElement.classList.contains("translated-rtl");
}

function hasTranslateCookie() {
  return document.cookie.split(";").some((cookie) => cookie.trim().startsWith("googtrans="));
}

function clearTranslateCookies() {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const hostParts = window.location.hostname.split(".");
  const domains = [window.location.hostname];

  if (hostParts.length > 1) {
    domains.push(`.${hostParts.slice(-2).join(".")}`);
  }

  document.cookie = `googtrans=; expires=${expires}; path=/`;
  for (const domain of domains) {
    document.cookie = `googtrans=; expires=${expires}; path=/; domain=${domain}`;
  }
}
