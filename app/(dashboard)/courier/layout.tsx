import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("COURIER", "/courier");
  if (user.role === "ADMIN") redirect("/admin");

  const courier = await db.courier.findUnique({
    where: { userId: user.id },
    select: { id: true, verificationStatus: true },
  });
  if (!courier) redirect("/registro/repartidor");
  if (courier.verificationStatus !== "VERIFIED") {
    redirect("/kyc?status=required");
  }

  return (
    <DashboardShell role="COURIER" user={{ name: user.name, email: user.email }}>
      {children}
    </DashboardShell>
  );
}
