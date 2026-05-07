"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Save, SlidersHorizontal, User } from "lucide-react";

type Account = {
  name: string;
  email: string;
};

export function SettingsForm({ account }: { account: Account }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [density, setDensity] = useState("comfortable");
  const [accent, setAccent] = useState("gold");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDensity(window.localStorage.getItem("admin-density") || "comfortable");
    setAccent(window.localStorage.getItem("admin-accent") || "gold");
    setReduceMotion(window.localStorage.getItem("admin-reduce-motion") === "true");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("admin-density", density);
    document.documentElement.dataset.adminDensity = density;
    window.dispatchEvent(new Event("admin-preferences-changed"));
  }, [density, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("admin-accent", accent);
    document.documentElement.dataset.adminAccent = accent;
    window.dispatchEvent(new Event("admin-preferences-changed"));
  }, [accent, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem("admin-reduce-motion", String(reduceMotion));
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
    window.dispatchEvent(new Event("admin-preferences-changed"));
  }, [mounted, reduceMotion]);

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, currentPassword, newPassword })
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    setMessage(response.ok ? "Account settings saved." : data.message || "Unable to save account settings.");

    if (response.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
      <form onSubmit={saveAccount} className="rounded-md border border-white/10 bg-obsidian p-5">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-gold" />
          <h2 className="font-heading text-2xl text-mist">Account settings</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="input-field" />
          </label>
          <label>
            <span className="label">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-field" />
          </label>
          <label>
            <span className="label">Current password</span>
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="input-field" autoComplete="current-password" />
          </label>
          <label>
            <span className="label">New password</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input-field" autoComplete="new-password" />
          </label>
        </div>
        {message ? <p className="mt-4 rounded-md border border-gold/20 bg-gold/10 p-3 text-sm text-muted">{message}</p> : null}
        <button type="submit" disabled={saving} className="btn-primary mt-5">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Account"}
        </button>
      </form>

      <section className="rounded-md border border-white/10 bg-obsidian p-5">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-gold" />
          <h2 className="font-heading text-2xl text-mist">Appearance</h2>
        </div>
        <div className="mt-5 grid gap-4">
          <label>
            <span className="label">Theme</span>
            <select value={theme || "system"} onChange={(event) => setTheme(event.target.value)} className="input-field">
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label>
            <span className="label">Dashboard density</span>
            <select value={density} onChange={(event) => setDensity(event.target.value)} className="input-field">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label>
            <span className="label">Accent</span>
            <select value={accent} onChange={(event) => setAccent(event.target.value)} className="input-field">
              <option value="gold">Gold</option>
              <option value="emerald">Emerald</option>
              <option value="rose">Rose</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-white/10 bg-midnight p-4 text-sm text-mist">
            <input type="checkbox" checked={reduceMotion} onChange={(event) => setReduceMotion(event.target.checked)} className="h-4 w-4 accent-gold" />
            Reduce dashboard motion
          </label>
        </div>
      </section>
    </div>
  );
}
