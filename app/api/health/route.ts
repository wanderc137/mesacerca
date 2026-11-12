import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // No contar usuarios en un endpoint público: solo comprobar la conexión.
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "mesacerca",
      db: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, service: "mesacerca", db: "error" },
      { status: 503 },
    );
  }
}
