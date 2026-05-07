"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await signIn("credentials", {
      redirect: false,
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || "")
    });

    setLoading(false);

    if (!response?.ok) {
      setError(response?.error || "Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label>
        <span className="label">Email</span>
        <input name="email" type="email" required className="input-field" autoComplete="email" />
      </label>
      <label>
        <span className="label">Password</span>
        <input name="password" type="password" required className="input-field" autoComplete="current-password" />
      </label>
      {error ? <p className="rounded-md border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
      <button type="submit" disabled={loading} className="btn-primary mt-2">
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
