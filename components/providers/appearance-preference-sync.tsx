"use client";

import { MotionConfig, type ReducedMotionConfig } from "framer-motion";
import { useEffect, useState } from "react";

type AppearancePreferences = {
  accent: string;
  density: string;
  reduceMotion: boolean;
};

const defaults: AppearancePreferences = {
  accent: "gold",
  density: "comfortable",
  reduceMotion: false
};

function readPreferences(): AppearancePreferences {
  if (typeof window === "undefined") return defaults;

  return {
    accent: window.localStorage.getItem("admin-accent") || defaults.accent,
    density: window.localStorage.getItem("admin-density") || defaults.density,
    reduceMotion: window.localStorage.getItem("admin-reduce-motion") === "true"
  };
}

function applyPreferences(preferences: AppearancePreferences) {
  document.documentElement.dataset.adminAccent = preferences.accent;
  document.documentElement.dataset.adminDensity = preferences.density;
  document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
}

export function AppearancePreferenceSync({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    const refresh = () => {
      const next = readPreferences();
      setPreferences(next);
      applyPreferences(next);
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("admin-preferences-changed", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("admin-preferences-changed", refresh);
    };
  }, []);

  const reducedMotion: ReducedMotionConfig = preferences.reduceMotion ? "always" : "user";

  return <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>;
}
