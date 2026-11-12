"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  startEmailVerification,
  startPhoneVerification,
  verifyEmailToken,
  verifyPhoneCode,
} from "@/lib/verification";

export async function verifyEmailAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const ok = await verifyEmailToken(token);
  redirect(`/verify-email?status=${ok ? "ok" : "invalid"}`);
}

export async function resendEmailVerificationAction() {
  const session = await getSession();
  if (!session) redirect("/login");
  const limit = rateLimit(`verify-email:${session.id}`, 3, 60 * 60 * 1000);
  if (!limit.ok) redirect("/settings/security?email=ratelimit");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });
  if (!user || user.emailVerifiedAt) redirect("/settings/security?email=already");

  try {
    await startEmailVerification(user);
  } catch (error) {
    console.error("No se pudo enviar la verificación de email", error);
    redirect("/settings/security?email=error");
  }
  redirect("/settings/security?email=sent");
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("56")) return `+${digits}`;
  if (digits.length === 9 && digits.startsWith("9")) return `+56${digits}`;
  if (digits.length === 10 && digits.startsWith("09")) return `+56${digits.slice(1)}`;
  return null;
}

export async function updatePhoneAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const limit = rateLimit(`update-phone:${session.id}`, 5, 60 * 60 * 1000);
  if (!limit.ok) redirect("/settings/security?phone=ratelimit");

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) redirect("/settings/security?phone=bad_format");

  const existing = await db.user.findFirst({
    where: { phone, NOT: { id: session.id } },
    select: { id: true },
  });
  if (existing) redirect("/settings/security?phone=taken");

  await db.user.update({
    where: { id: session.id },
    data: {
      phone,
      phoneVerifiedAt: null,
      phoneVerificationCode: null,
      phoneVerificationExpiresAt: null,
    },
  });
  await db.auditLog.create({
    data: {
      actorId: session.id,
      action: "phone.updated",
      entity: "User",
      entityId: session.id,
      after: JSON.stringify({ changed: true }),
    },
  });
  redirect("/settings/security?phone=saved");
}

export async function startPhoneVerificationAction() {
  const session = await getSession();
  if (!session) redirect("/login");
  const limit = rateLimit(`verify-phone:${session.id}`, 10, 60 * 60 * 1000);
  if (!limit.ok) redirect("/settings/security?phone=ratelimit");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, phone: true, phoneVerifiedAt: true },
  });
  if (!user || user.phoneVerifiedAt) redirect("/settings/security?phone=already");

  try {
    const result = await startPhoneVerification(user);
    if (!result.ok) redirect("/settings/security?phone=missing");
  } catch (error) {
    console.error("No se pudo enviar el SMS", error);
    redirect("/settings/security?phone=error");
  }

  // En desarrollo, el código se registra en el log del servidor.
  redirect("/settings/security?phone=sent");
}

export async function verifyPhoneAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const limit = rateLimit(`verify-phone-code:${session.id}`, 6, 10 * 60 * 1000);
  if (!limit.ok) redirect("/settings/security?phone=ratelimit");

  const code = String(formData.get("code") ?? "").trim();
  const ok = await verifyPhoneCode(session.id, code);
  redirect(`/settings/security?phone=${ok ? "verified" : "invalid"}`);
}
