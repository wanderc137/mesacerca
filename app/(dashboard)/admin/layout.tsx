import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN" && user.role !== "SUPPORT") {
    redirect("/");
  }
  if (process.env.MFA_ENFORCED === "true" && !user.mfaEnabled) {
    redirect("/settings/security");
  }

  return (
    <DashboardShell role={user.role} user={{ name: user.name, email: user.email }}>
      {children}
    </DashboardShell>
  );
}
