import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import { getCourierDashboard } from "@/lib/courier/data";

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session || session.role !== "COURIER") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const courier = await db.courier.findUnique({
    where: { userId: session.id },
    select: { id: true, verificationStatus: true },
  });
  if (!courier) {
    return NextResponse.json({ error: "Repartidor no encontrado." }, { status: 404 });
  }
  if (courier.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      { error: "Tu cuenta de repartidor aún no está verificada." },
      { status: 403 },
    );
  }
  const dashboard = await getCourierDashboard(courier.id);
  if (!dashboard) {
    return NextResponse.json({ error: "Repartidor no encontrado." }, { status: 404 });
  }
  return NextResponse.json(dashboard);
}
