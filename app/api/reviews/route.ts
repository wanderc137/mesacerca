import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRequestSession } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { exceedsBodyLimit, SMALL_JSON_BODY_LIMIT } from "@/lib/request";
import { reviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const limit = rateLimit(`reviews:${session.id}`, 6, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas calificaciones. Espera un minuto." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  if (exceedsBodyLimit(request, SMALL_JSON_BODY_LIMIT)) {
    return NextResponse.json({ error: "Payload demasiado grande." }, { status: 413 });
  }
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { reviews: true },
  });
  if (!order || order.customerId !== session.id) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }
  if (!["DELIVERED", "COMPLETED"].includes(order.status)) {
    return NextResponse.json(
      { error: "Solo puedes calificar pedidos entregados." },
      { status: 409 },
    );
  }
  if (order.reviews.some((review) => review.authorId === session.id)) {
    return NextResponse.json(
      { error: "Ya calificaste este pedido." },
      { status: 409 },
    );
  }

  try {
    await db.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        orderId: order.id,
        authorId: session.id,
        targetType: "MERCHANT",
        targetId: order.storeId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    if (order.courierId) {
      await tx.review.create({
        data: {
          orderId: order.id,
          authorId: session.id,
          targetType: "COURIER",
          targetId: order.courierId,
          rating: parsed.data.rating,
          comment: parsed.data.comment,
        },
      });
    }

    const storeAggregate = await tx.review.aggregate({
      where: { targetType: "MERCHANT", targetId: order.storeId },
      _avg: { rating: true },
      _count: true,
    });
    await tx.store.update({
      where: { id: order.storeId },
      data: {
        rating: storeAggregate._avg.rating ?? 4.8,
        ratingCount: storeAggregate._count,
      },
    });

    if (order.courierId) {
      const courierAggregate = await tx.review.aggregate({
        where: { targetType: "COURIER", targetId: order.courierId },
        _avg: { rating: true },
        _count: true,
      });
      await tx.courier.update({
        where: { id: order.courierId },
        data: {
          rating: courierAggregate._avg.rating ?? 5,
          ratingCount: courierAggregate._count,
        },
      });
    }

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "REVIEWED",
        actorId: session.id,
        payload: JSON.stringify({ rating: parsed.data.rating }),
      },
    });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya calificaste este pedido." },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
