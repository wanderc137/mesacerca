"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  clearMfaPending,
  createMfaPending,
  createSession,
  getMfaPending,
  getSession,
  homeForRole,
} from "@/lib/auth";
import { auditAuth } from "@/lib/audit";
import { getClientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import {
  MFA_RECOVERY_COOKIE,
  MFA_SETUP_SECRET_COOKIE,
  consumeRecoveryCode,
  createTotpSecret,
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyTotp,
} from "@/lib/mfa";

export type MfaState = {
  error?: string;
  ok?: boolean;
  recoveryCodes?: string[];
};

export async function startMfaSetupAction() {
  const pending = await getMfaPending("setup");
  const session = pending ? null : await getSession();
  if (!pending && !session) redirect("/login");

  const role = pending?.role ?? session!.role;
  if (!["ADMIN", "SUPPORT", "MERCHANT"].includes(role)) {
    redirect("/settings/security?mfa=unsupported");
  }

  const userId = pending?.id ?? session!.id;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });
  if (!user) redirect("/login");
  if (user.mfaEnabled) redirect("/settings/security");

  const secret = createTotpSecret();
  const store = await cookies();
  store.set(MFA_SETUP_SECRET_COOKIE, encryptMfaSecret(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  if (!pending) {
    await createMfaPending(userId, "setup", session!.tokenVersion);
  }
  redirect("/mfa/setup");
}

export async function verifyMfaSetupAction(
  _prev: MfaState,
  formData: FormData,
): Promise<MfaState> {
  const pending = await getMfaPending("setup");
  if (!pending) {
    return { error: "La sesión de configuración expiró. Vuelve a entrar." };
  }
  if (pending.mfaEnabled) {
    return { error: "MFA ya está activo en esta cuenta." };
  }

  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const limit = rateLimit(`mfa-setup:${pending.id}`, 6, 60_000);
  if (!limit.ok) {
    return { error: "Demasiados intentos. Espera un minuto." };
  }

  const token = String(formData.get("code") ?? "").trim();
  const store = await cookies();
  const encrypted = store.get(MFA_SETUP_SECRET_COOKIE)?.value;
  if (!encrypted) {
    return { error: "No encontramos el secreto de configuración. Reinicia el proceso." };
  }
  const secret = decryptMfaSecret(encrypted);
  if (!secret) {
    return { error: "El secreto de configuración no es válido. Reinicia el proceso." };
  }

  if (!(await verifyTotp(secret, token))) {
    await auditAuth("mfa_failed", {
      userId: pending.id,
      email: pending.email,
      ip,
      detail: "setup",
    });
    return { error: "Código incorrecto. Revisa la hora del teléfono e intenta de nuevo." };
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashedCodes = await hashRecoveryCodes(recoveryCodes);

  const updated = await db.user.update({
    where: { id: pending.id },
    data: {
      mfaEnabled: true,
      mfaSecret: encrypted,
      mfaRecoveryCodes: hashedCodes,
      mfaEnabledAt: new Date(),
      // Al activar MFA se revocan las sesiones anteriores.
      tokenVersion: { increment: 1 },
    },
    select: { tokenVersion: true },
  });

  store.set(MFA_RECOVERY_COOKIE, JSON.stringify(recoveryCodes), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  store.delete(MFA_SETUP_SECRET_COOKIE);
  await clearMfaPending("setup");
  await createSession({
    id: pending.id,
    email: pending.email,
    name: pending.name,
    role: pending.role,
    tokenVersion: updated.tokenVersion,
  });
  await auditAuth("mfa_enabled", {
    userId: pending.id,
    email: pending.email,
    ip,
  });

  redirect("/mfa/recovery");
}

export async function finishMfaSetupAction() {
  const store = await cookies();
  store.delete(MFA_RECOVERY_COOKIE);
  const session = await getSession();
  redirect(session ? homeForRole(session.role) : "/");
}

export async function verifyMfaLoginAction(
  _prev: MfaState,
  formData: FormData,
): Promise<MfaState> {
  const pending = await getMfaPending("login");
  if (!pending) {
    return { error: "La verificación expiró. Vuelve a iniciar sesión." };
  }

  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const limit = rateLimit(`mfa-login:${pending.id}`, 5, 60_000);
  if (!limit.ok) {
    return { error: "Demasiados intentos. Espera un minuto." };
  }

  const user = await db.user.findUnique({
    where: { id: pending.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tokenVersion: true,
      mfaEnabled: true,
      mfaSecret: true,
      mfaRecoveryCodes: true,
    },
  });
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return { error: "La cuenta no tiene MFA configurado." };
  }

  const token = String(formData.get("code") ?? "").trim();
  const recoveryCode = String(formData.get("recoveryCode") ?? "").trim();
  let valid = false;

  if (recoveryCode) {
    const result = await consumeRecoveryCode(user.mfaRecoveryCodes, recoveryCode);
    if (result.ok) {
      valid = true;
      await db.user.update({
        where: { id: user.id },
        data: { mfaRecoveryCodes: result.remaining },
      });
    }
  } else {
    const secret = decryptMfaSecret(user.mfaSecret);
    if (secret) valid = await verifyTotp(secret, token);
  }

  if (!valid) {
    await auditAuth("mfa_failed", {
      userId: user.id,
      email: user.email,
      ip,
      detail: recoveryCode ? "recovery" : "totp",
    });
    return {
      error: recoveryCode
        ? "Código de recuperación inválido o ya utilizado."
        : "Código incorrecto. Revisa la hora del teléfono.",
    };
  }

  await clearMfaPending("login");
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  await auditAuth("mfa_success", {
    userId: user.id,
    email: user.email,
    ip,
  });

  redirect(homeForRole(user.role));
}
