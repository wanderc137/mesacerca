import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("MERCHANT", "/merchant");
  if (user.role === "ADMIN") redirect("/admin");

  const merchant = await db.merchant.findUnique({
    where: { ownerId: user.id },
    select: { id: true, name: true, status: true },
  });

  if (!merchant) {
    redirect("/registro/local");
  }
  if (process.env.MFA_ENFORCED === "true" && !user.mfaEnabled) {
    redirect("/settings/security");
  }

  return (
    <DashboardShell role="MERCHANT" user={{ name: user.name, email: user.email }}>
      {children}
    </DashboardShell>
  );
}
