import { AdminNav } from "@/components/admin/admin-nav";
import { AdminNotificationCenter } from "@/components/admin/admin-notification-center";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-panel grid min-h-[calc(100vh-5rem)] lg:grid-cols-[280px_1fr]">
      <AdminNav />
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">
        <AdminNotificationCenter />
        {children}
      </div>
    </div>
  );
}
