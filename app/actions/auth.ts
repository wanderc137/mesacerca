"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  homeForRole,
  verifyPassword,
  DUMMY_PASSWORD_HASH,
  createMfaPending,
} from "@/lib/auth";
import {
  courierRegisterSchema,
  loginSchema,
  merchantRegisterSchema,
  registerSchema,
} from "@/lib/validation";
import { COMUNA_BY_NAME, CUISINES } from "@/lib/constants";
import { rateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { auditAuth } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { startEmailVerification } from "@/lib/verification";

export type AuthState = { error?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    /[\u0000-\u001f]/.test(next)
  ) {
    return null;
  }
  try {
    const url = new URL(next, "http://mesacerca.local");
    if (url.origin !== "http://mesacerca.local") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

async function registrationLimit() {
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const minute = rateLimit(`register:${ip}:minute`, 5, 60_000);
  const hour = rateLimit(`register:${ip}:hour`, 20, 60 * 60 * 1000);
  return {
    ok: minute.ok && hour.ok,
    retryAfter: Math.max(minute.retryAfter, hour.retryAfter),
  };
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const headerStore = await headers();
  const ip = getClientIpFromHeaders(headerStore);
  const byEmail = rateLimit(`web-login:${email}`, 8, 60_000);
  const byIp = rateLimit(`web-login-ip:${ip}`, 20, 60_000);
  if (!byEmail.ok || !byIp.ok) {
    return { error: "Demasiados intentos. Espera un minuto." };
  }

  const user = await db.user.findUnique({ where: { email } });
  const validPassword = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !validPassword) {
    await auditAuth("login_failed", { email, ip });
    return { error: "Email o contraseña incorrectos." };
  }
  if (user.status !== "ACTIVE") {
    await auditAuth("login_failed", {
      userId: user.id,
      email,
      ip,
      detail: "suspended",
    });
    return { error: "Tu cuenta está suspendida. Contacta a soporte." };
  }

  await auditAuth("login_success", { userId: user.id, email, ip });

  if (user.mfaEnabled) {
    await createMfaPending(user.id, "login", user.tokenVersion);
    redirect("/mfa");
  }

  const mfaRequired =
    process.env.MFA_ENFORCED === "true" &&
    (user.role === "ADMIN" ||
      user.role === "SUPPORT" ||
      user.role === "MERCHANT");
  if (mfaRequired) {
    await createMfaPending(user.id, "setup", user.tokenVersion);
    redirect("/mfa/setup");
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  redirect(safeNext(formData.get("next")) ?? homeForRole(user.role));
}

export async function registerCustomerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limit = await registrationLimit();
  if (!limit.ok) {
    return { error: "Demasiados registros desde esta conexión. Intenta más tarde." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Ya existe una cuenta con ese email." };
  if (parsed.data.phone) {
    const phoneInUse = await db.user.findUnique({
      where: { phone: parsed.data.phone.trim() },
    });
    if (phoneInUse) return { error: "Ese teléfono ya está registrado." };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      phone: parsed.data.phone?.trim() || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CUSTOMER",
    },
  });

  await startEmailVerification({
    id: user.id,
    email: user.email,
    name: user.name,
  }).catch((error) => console.error("No se pudo enviar verificación de email", error));

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  redirect("/");
}

export async function registerMerchantAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limit = await registrationLimit();
  if (!limit.ok) {
    return { error: "Demasiados registros desde esta conexión. Intenta más tarde." };
  }
  const parsed = merchantRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    storeName: formData.get("storeName"),
    comuna: formData.get("comuna"),
    address: formData.get("address"),
    cuisine: formData.get("cuisine"),
    deliveryMode: formData.get("deliveryMode") || "HYBRID",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Ya existe una cuenta con ese email." };
  if (parsed.data.phone) {
    const phoneInUse = await db.user.findUnique({
      where: { phone: parsed.data.phone.trim() },
    });
    if (phoneInUse) return { error: "Ese teléfono ya está registrado." };
  }

  const comuna = COMUNA_BY_NAME.get(parsed.data.comuna);
  if (!comuna) return { error: "Comuna no válida." };

  const cuisine = CUISINES[parsed.data.cuisine] ?? CUISINES.Chilena;
  const baseSlug = slugify(parsed.data.storeName) || "local";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        phone: parsed.data.phone?.trim() || null,
        passwordHash,
        role: "MERCHANT",
      },
    });

    const merchant = await tx.merchant.create({
      data: {
        ownerId: created.id,
        name: parsed.data.storeName.trim(),
        status: "PENDING",
        commissionPlan: "HYBRID",
        deliveryMode: parsed.data.deliveryMode,
        coverUrl: cuisine.image,
      },
    });

    const store = await tx.store.create({
      data: {
        merchantId: merchant.id,
        name: parsed.data.storeName.trim(),
        slug,
        description: "Cocina local en MesaCerca.",
        cuisine: parsed.data.cuisine,
        emoji: cuisine.emoji,
        address: parsed.data.address.trim(),
        comuna: parsed.data.comuna,
        lat: comuna.lat,
        lng: comuna.lng,
        status: "PENDING",
        coverUrl: cuisine.image,
      },
    });

    await tx.category.createMany({
      data: [
        { storeId: store.id, name: "Recomendados", position: 0 },
        { storeId: store.id, name: "Platos fuertes", position: 1 },
        { storeId: store.id, name: "Bebidas", position: 2 },
      ],
    });

    return created;
  });

  await startEmailVerification({
    id: user.id,
    email: user.email,
    name: user.name,
  }).catch((error) => console.error("No se pudo enviar verificación de email", error));

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  redirect("/merchant");
}

export async function registerCourierAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const limit = await registrationLimit();
  if (!limit.ok) {
    return { error: "Demasiados registros desde esta conexión. Intenta más tarde." };
  }
  const parsed = courierRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    vehicle: formData.get("vehicle") || "MOTORCYCLE",
    zone: formData.get("zone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { error: "Ya existe una cuenta con ese email." };
  if (parsed.data.phone) {
    const phoneInUse = await db.user.findUnique({
      where: { phone: parsed.data.phone.trim() },
    });
    if (phoneInUse) return { error: "Ese teléfono ya está registrado." };
  }

  const comuna = COMUNA_BY_NAME.get(parsed.data.zone);
  if (!comuna) return { error: "Comuna no válida." };

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: parsed.data.name.trim(),
        email,
        phone: parsed.data.phone?.trim() || null,
        passwordHash,
        role: "COURIER",
      },
    });
    await tx.courier.create({
      data: {
        userId: created.id,
        phone: parsed.data.phone?.trim() || null,
        vehicle: parsed.data.vehicle,
        zone: parsed.data.zone,
        status: "OFFLINE",
        verificationStatus: "PENDING",
        currentLat: comuna.lat,
        currentLng: comuna.lng,
      },
    });
    return created;
  });

  await startEmailVerification({
    id: user.id,
    email: user.email,
    name: user.name,
  }).catch((error) => console.error("No se pudo enviar verificación de email", error));

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  redirect("/courier");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await db.user.update({
      where: { id: session.id },
      data: { tokenVersion: { increment: 1 } },
    });
    const headerStore = await headers();
    await auditAuth("logout", {
      userId: session.id,
      email: session.email,
      ip: getClientIpFromHeaders(headerStore),
    });
  }
  await destroySession();
  redirect("/");
}
