import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function getAdminSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return session;
}
