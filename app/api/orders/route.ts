import { NextResponse } from "next/server";
import { Prisma, type Order } from "@prisma/client";
import { getRequestSession } from "@/lib/mobile-auth";
import { rateLimit } from "@/lib/rate-limit";
import { exceedsBodyLimit, JSON_BODY_LIMIT } from "@/lib/request";
import { db } from "@/lib/db";
import { createOrderSchema } from "@/lib/validation";
import { COMUNA_BY_NAME, COMMISSION_RATES } from "@/lib/constants";
import { calculateFees, distanceForComuna } from "@/lib/pricing";
import { generateOrderCode, generatePin } from "@/lib/utils";
import { createPayment } from "@/lib/payments";
import { markOrderPaid, markPaymentFailed } from "@/lib/payments/sync";
import type { PaymentProvider } from "@/lib/payments/types";

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para pedir." },
      { status: 401 },
    );
  }
  if (session.role !== "CUSTOMER" && session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Esta cuenta no puede hacer pedidos." },
      { status: 403 },
    );
  }

  const limit = rateLimit(`orders:${session.id}`, 12, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiados pedidos en poco tiempo. Espera un minuto." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  let body: unknown;
  if (exceedsBodyLimit(request, JSON_BODY_LIMIT)) {
    return NextResponse.json({ error: "Pedido demasiado grande." }, { status: 413 });
  }
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const input = parsed.data;

  if (input.clientRequestId) {
    const existing = await db.order.findUnique({
      where: { clientRequestId: input.clientRequestId },
    });
    if (existing) {
      if (existing.customerId !== session.id) {
        return NextResponse.json(
          { error: "Solicitud duplicada inválida." },
          { status: 409 },
        );
      }
      return NextResponse.json({
        orderId: existing.id,
        code: existing.code,
        status: existing.status,
        idempotent: true,
      });
    }
  }

  const store = await db.store.findUnique({
    where: { id: input.storeId },
    include: { merchant: true },
  });
  if (
    !store ||
    store.status !== "ACTIVE" ||
    store.merchant.status !== "VERIFIED"
  ) {
    return NextResponse.json(
      { error: "El local no está disponible." },
      { status: 404 },
    );
  }
  if (store.merchant.ownerId === session.id) {
    return NextResponse.json(
      { error: "No puedes pedir desde tu propio local." },
      { status: 403 },
    );
  }

  if (input.deliveryMode === "DELIVERY" && !input.address) {
    return NextResponse.json(
      { error: "Falta la dirección de entrega." },
      { status: 400 },
    );
  }

  const items = await db.menuItem.findMany({
    where: { id: { in: input.items.map((line) => line.itemId) } },
    include: {
      category: { include: { store: { include: { merchant: true } } } },
      modifiers: { include: { options: true } },
    },
  });
  const itemById = new Map(items.map((item) => [item.id, item]));

  const lines: {
    itemId: string;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
    modifiersJson: string | null;
    notes: string | null;
  }[] = [];

  for (const line of input.items) {
    const item = itemById.get(line.itemId);
    if (!item || item.category.storeId !== store.id) {
      return NextResponse.json(
        { error: "Uno de los platos no pertenece a este local." },
        { status: 400 },
      );
    }
    if (!item.available) {
      return NextResponse.json(
        { error: `${item.name} está agotado. Quita el plato para continuar.` },
        { status: 409 },
      );
    }

    const selectedIds = new Set(line.modifierOptionIds);
    const validOptionIds = new Set(
      item.modifiers.flatMap((modifier) => modifier.options.map((option) => option.id)),
    );
    for (const id of selectedIds) {
      if (!validOptionIds.has(id)) {
        return NextResponse.json(
          { error: "Una opción del pedido ya no está disponible." },
          { status: 400 },
        );
      }
    }

    let modifierDelta = 0;
    const selectedOptions: { id: string; name: string; priceDelta: number }[] = [];

    for (const modifier of item.modifiers) {
      const chosen = modifier.options.filter((option) => selectedIds.has(option.id));
      if (modifier.required && chosen.length === 0) {
        return NextResponse.json(
          { error: `Elige ${modifier.name} para ${item.name}.` },
          { status: 400 },
        );
      }
      if (chosen.length < modifier.min || chosen.length > modifier.max) {
        return NextResponse.json(
          {
            error: `La selección de ${modifier.name} no es válida para ${item.name}.`,
          },
          { status: 400 },
        );
      }
      for (const option of chosen) {
        modifierDelta += option.priceDelta;
        selectedOptions.push({
          id: option.id,
          name: option.name,
          priceDelta: option.priceDelta,
        });
      }
    }

    lines.push({
      itemId: item.id,
      nameSnapshot: item.name,
      unitPrice: item.price + modifierDelta,
      quantity: line.quantity,
      modifiersJson: selectedOptions.length
        ? JSON.stringify(selectedOptions)
        : null,
      notes: line.notes ?? null,
    });
  }

  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );

  if (subtotal < store.minOrder) {
    return NextResponse.json(
      {
        error: `El pedido mínimo de ${store.name} es de $${store.minOrder.toLocaleString("es-CL")}.`,
      },
      { status: 400 },
    );
  }

  const deliveryMode = input.deliveryMode;
  const addressComuna =
    deliveryMode === "DELIVERY"
      ? COMUNA_BY_NAME.get(input.address?.comuna ?? "")
      : COMUNA_BY_NAME.get(store.comuna);

  if (!addressComuna) {
    return NextResponse.json(
      { error: "La comuna de entrega no es válida." },
      { status: 400 },
    );
  }

  const distanceKm =
    deliveryMode === "DELIVERY"
      ? distanceForComuna(
          { lat: store.lat, lng: store.lng, comuna: store.comuna },
          addressComuna,
        )
      : 0;

  const commissionRate = COMMISSION_RATES[store.merchant.commissionPlan] ?? 17;
  const fees = calculateFees({
    subtotal,
    distanceKm,
    deliveryMode,
    tip: input.tip,
    commissionRate,
  });

  const orderCode = generateOrderCode();
  const pickupPin = generatePin();
  const deliveryPin = generatePin();
  const provider = input.paymentProvider as PaymentProvider;

  let order: Order;
  try {
    order = await db.order.create({
      data: {
      code: orderCode,
      clientRequestId: input.clientRequestId ?? null,
      customerId: session.id,
      storeId: store.id,
      status: "PENDING_PAYMENT",
      deliveryMode,
      fulfillment:
        deliveryMode === "PICKUP"
          ? "PICKUP"
          : store.merchant.deliveryMode === "OWN"
            ? "OWN"
            : "PLATFORM",
      subtotal: fees.subtotal,
      deliveryFee: fees.deliveryFee,
      serviceFee: fees.serviceFee,
      tip: fees.tip,
      discount: fees.discount,
      total: fees.total,
      commissionRate: fees.commissionRate,
      commissionAmount: fees.commissionAmount,
      courierPayout: fees.courierPayout,
      distanceKm: fees.distanceKm,
      paymentStatus: "PENDING",
      paymentProvider: provider,
      addressLine:
        deliveryMode === "DELIVERY"
          ? input.address?.line1 ?? ""
          : store.address,
      comuna: addressComuna.name,
      lat: addressComuna.lat,
      lng: addressComuna.lng,
      instructions:
        deliveryMode === "DELIVERY" ? input.address?.instructions ?? null : null,
      pickupPin,
      deliveryPin,
      items: {
        create: lines,
      },
      events: {
        create: [
          {
            type: "ORDER_CREATED",
            actorId: session.id,
            payload: JSON.stringify({
              total: fees.total,
              paymentProvider: provider,
              deliveryMode,
            }),
          },
        ],
      },
      payment: {
        create: {
          provider,
          status: "PENDING",
          amount: fees.total,
        },
      },
    },
    });
  } catch (error) {
    if (
      input.clientRequestId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.order.findUnique({
        where: { clientRequestId: input.clientRequestId },
      });
      if (existing && existing.customerId === session.id) {
        return NextResponse.json({
          orderId: existing.id,
          code: existing.code,
          status: existing.status,
          idempotent: true,
        });
      }
    }
    throw error;
  }

  // Guardar la dirección para la próxima compra (sin bloquear el pedido).
  if (deliveryMode === "DELIVERY" && input.address?.line1) {
    try {
      const existing = await db.address.findFirst({
        where: {
          userId: session.id,
          line1: input.address.line1,
          comuna: addressComuna.name,
        },
      });
      if (!existing) {
        await db.address.create({
          data: {
            userId: session.id,
            label: "Casa",
            line1: input.address.line1,
            comuna: addressComuna.name,
            lat: addressComuna.lat,
            lng: addressComuna.lng,
            instructions: input.address.instructions,
            isDefault: true,
          },
        });
        await db.address.updateMany({
          where: { userId: session.id, NOT: { line1: input.address.line1 } },
          data: { isDefault: false },
        });
      }
    } catch {
      // La dirección es una comodidad, no un requisito del pedido.
    }
  }

  if (provider === "CASH") {
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: { status: "PENDING_MERCHANT", paymentStatus: "PENDING" },
      }),
      db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "PAYMENT_CASH_PENDING",
          payload: JSON.stringify({ provider }),
        },
      }),
    ]);
    return NextResponse.json({
      orderId: order.id,
      code: order.code,
      status: "PENDING_MERCHANT",
    });
  }

  try {
    const payment = await createPayment(
      {
        id: order.id,
        code: order.code,
        total: order.total,
        customerId: session.id,
        customerName: session.name,
        customerEmail: session.email,
        storeName: store.name,
      },
      provider,
    );

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: payment.provider,
        paymentRef: payment.providerRef,
      },
    });
    await db.payment.updateMany({
      where: { orderId: order.id },
      data: {
        provider: payment.provider,
        providerRef: payment.providerRef,
      },
    });

    if (payment.status === "PAID") {
      await markOrderPaid({
        orderId: order.id,
        provider: payment.provider,
        providerRef: payment.providerRef,
        raw: payment.raw,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      code: order.code,
      redirectUrl: payment.redirectUrl,
      status: payment.status,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pudimos iniciar el pago. Intenta de nuevo.";
    await markPaymentFailed({
      orderId: order.id,
      provider,
      raw: JSON.stringify({ message }),
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
