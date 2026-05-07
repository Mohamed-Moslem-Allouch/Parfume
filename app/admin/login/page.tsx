import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="section-shell grid min-h-[calc(100vh-5rem)] place-items-center py-12">
      <div className="w-full max-w-md rounded-md border border-gold/25 bg-obsidian p-6 shadow-gold sm:p-8">
        <Logo />
        <div className="mt-8">
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Admin</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Sign in</h1>
          <p className="mt-3 text-sm text-muted">Use the seeded admin credentials from your environment.</p>
        </div>
        <div className="mt-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
