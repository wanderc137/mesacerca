import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCourierDashboard } from "@/lib/courier/data";
import { CourierDashboardClient } from "@/components/courier/courier-dashboard-client";

export const dynamic = "force-dynamic";

export default async function CourierPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/courier");

  const courier = await db.courier.findUnique({
    where: { userId: session.id },
    select: { id: true, verificationStatus: true },
  });
  if (!courier) redirect("/registro/repartidor");
  if (courier.verificationStatus !== "VERIFIED") {
    redirect("/kyc?status=required");
  }

  const dashboard = await getCourierDashboard(courier.id);
  if (!dashboard) redirect("/registro/repartidor");

  return <CourierDashboardClient initial={dashboard} />;
}
