"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { startKyc, type KycRole } from "@/lib/kyc";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login?next=/admin");
  }
  if (process.env.MFA_ENFORCED === "true" && !session.mfaEnabled) {
    redirect("/settings/security");
  }
  return session;
}

export async function startKycAction() {
  const session = await getSession();
  if (!session) redirect("/login?next=/kyc");
  if (session.role !== "MERCHANT" && session.role !== "COURIER") {
    redirect("/");
  }

  // Cada start crea una sesión facturable en Didit. Evita abuso de costo.
  const limit = rateLimit(`kyc-start:${session.id}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    redirect("/kyc?status=ratelimit");
  }

  let redirectUrl: string | null = null;
  try {
    const result = await startKyc(
      { id: session.id, email: session.email, name: session.name },
      session.role as KycRole,
    );
    redirectUrl = result.redirectUrl;
  } catch (error) {
    console.error("No se pudo iniciar KYC", error);
    redirect("/kyc?status=error");
  }
  redirect(redirectUrl ?? "/kyc?status=pending");
}

export async function setKycStatusAction(formData: FormData) {
  const session = await requireAdmin();
  const caseId = String(formData.get("caseId") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 240);
  if (!caseId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) return;

  const record = await db.kycCase.findUnique({ where: { id: caseId } });
  if (!record) return;

  await db.kycCase.update({
    where: { id: caseId },
    data: {
      status,
      reason: reason || null,
      reviewedAt: status === "PENDING" ? null : new Date(),
    },
  });
  await db.auditLog.create({
    data: {
      actorId: session.id,
      action: `kyc.${status.toLowerCase()}`,
      entity: "KycCase",
      entityId: caseId,
      before: JSON.stringify({ status: record.status }),
      after: JSON.stringify({ status, reason }),
    },
  });

  revalidatePath("/admin/kyc");
  revalidatePath("/kyc");
  revalidatePath("/admin");
}
