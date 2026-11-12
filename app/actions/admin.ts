"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { refundPayment } from "@/lib/payments";
import { isKycApproved } from "@/lib/kyc";
import { markOrderRefunded } from "@/lib/payments/sync";

async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPPORT")) {
    redirect("/login?next=/admin");
  }
  if (process.env.MFA_ENFORCED === "true" && !session.mfaEnabled) {
    redirect("/settings/security");
  }
  return session;
}

async function requireFullAdmin() {
  const session = await requireAdmin();
  if (session.role !== "ADMIN") {
    redirect("/admin?error=forbidden");
  }
  return session;
}

async function audit(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
    },
  });
}

export async function setMerchantStatusAction(formData: FormData) {
  const session = await requireFullAdmin();
  const merchantId = String(formData.get("merchantId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!merchantId || !["VERIFIED", "SUSPENDED", "PENDING"].includes(status)) return;

  const merchant = await db.merchant.findUnique({
    where: { id: merchantId },
    include: { stores: true },
  });
  if (!merchant) return;
  if (status === "VERIFIED" && !(await isKycApproved(merchant.ownerId, "MERCHANT"))) {
    return;
  }
  if (status === "VERIFIED" && process.env.EMAIL_VERIFICATION_REQUIRED === "true") {
    const owner = await db.user.findUnique({
      where: { id: merchant.ownerId },
      select: { emailVerifiedAt: true },
    });
    if (!owner?.emailVerifiedAt) return;
  }

  await db.$transaction(async (tx) => {
    await tx.merchant.update({
      where: { id: merchantId },
      data: { status },
    });
    await tx.store.updateMany({
      where: { merchantId },
      data: {
        status:
          status === "VERIFIED"
            ? "ACTIVE"
            : status === "SUSPENDED"
              ? "SUSPENDED"
              : "PENDING",
      },
    });
    if (status === "SUSPENDED" || status === "VERIFIED") {
      await tx.user.update({
        where: { id: merchant.ownerId },
        data: {
          status: status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
          ...(status === "SUSPENDED"
            ? { tokenVersion: { increment: 1 } }
            : {}),
        },
      });
    }
  });

  await audit(session.id, `merchant.${status.toLowerCase()}`, "Merchant", merchantId, {
    status: merchant.status,
  }, { status });
  revalidatePath("/admin/merchants");
  revalidatePath("/admin");
}

export async function setCourierVerificationAction(formData: FormData) {
  const session = await requireFullAdmin();
  const courierId = String(formData.get("courierId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!courierId || !["VERIFIED", "SUSPENDED", "PENDING"].includes(status)) return;

  const courier = await db.courier.findUnique({ where: { id: courierId } });
  if (!courier) return;
  if (status === "VERIFIED" && !(await isKycApproved(courier.userId, "COURIER"))) {
    return;
  }
  if (status === "VERIFIED" && process.env.EMAIL_VERIFICATION_REQUIRED === "true") {
    const owner = await db.user.findUnique({
      where: { id: courier.userId },
      select: { emailVerifiedAt: true },
    });
    if (!owner?.emailVerifiedAt) return;
  }

  await db.$transaction(async (tx) => {
    await tx.courier.update({
      where: { id: courierId },
      data: {
        verificationStatus: status,
        status: status === "VERIFIED" ? courier.status : "OFFLINE",
      },
    });
    await tx.user.update({
      where: { id: courier.userId },
      data: {
        status: status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
        ...(status === "SUSPENDED"
          ? { tokenVersion: { increment: 1 } }
          : {}),
      },
    });
  });

  await audit(session.id, `courier.${status.toLowerCase()}`, "Courier", courierId, {
    status: courier.verificationStatus,
  }, { status });
  revalidatePath("/admin/couriers");
  revalidatePath("/admin");
}

export async function adminCancelOrderAction(formData: FormData) {
  const session = await requireFullAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const action = String(formData.get("action") ?? "cancel");
  if (!orderId) return;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.status === "REFUNDED" || order.paymentStatus === "REFUNDED") return;
  if (
    action !== "refund" &&
    ["DELIVERED", "COMPLETED"].includes(order.status)
  ) {
    return;
  }

  if (action === "refund" && ["PAID", "REFUND_PENDING"].includes(order.paymentStatus)) {
    try {
      await refundPayment(
        order.paymentProvider ?? "",
        order.paymentRef,
        order.total,
      );
    } catch (error) {
      console.error("No se pudo reembolsar en la pasarela", error);
      return;
    }
    await markOrderRefunded(orderId, "Reembolso administrativo");
  } else if (action === "refund") {
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED_BY_MERCHANT",
          cancellationReason: "Cancelado por administración (sin pago)",
        },
      }),
      db.orderEvent.create({
        data: {
          orderId,
          type: "CANCELLED",
          actorId: session.id,
          payload: JSON.stringify({ reason: "Cancelado por administración (sin pago)" }),
        },
      }),
    ]);
  } else {
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED_BY_MERCHANT",
          cancellationReason: "Cancelado por administración",
          paymentStatus:
            order.paymentStatus === "PAID"
              ? order.paymentProvider === "MOCK"
                ? "REFUNDED"
                : "REFUND_PENDING"
              : "CANCELLED",
        },
      }),
      db.orderEvent.create({
        data: {
          orderId,
          type: "CANCELLED",
          actorId: session.id,
          payload: JSON.stringify({ reason: "Cancelado por administración" }),
        },
      }),
    ]);
  }

  await audit(session.id, `order.${action}`, "Order", orderId, {
    status: order.status,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
