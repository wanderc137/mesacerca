import Link from "next/link";
import { ArrowRight, ClipboardList, UtensilsCrossed } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCLP, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await requireUser("/orders");

  const orders = await db.order.findMany({
    where: { customerId: session.id },
    include: {
      store: { select: { name: true, emoji: true, slug: true, comuna: true } },
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Tu historial
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Mis pedidos
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sigue tus pedidos activos y vuelve a pedir tus favoritos.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary hidden sm:inline-flex">
          <UtensilsCrossed className="h-4 w-4" />
          Ver cocinas
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Todavía no tienes pedidos"
          description="Cuando hagas tu primer pedido, aparecerá aquí con su seguimiento."
          action={<Link href="/" className="btn btn-primary">Explorar cocinas</Link>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            return (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-surface/60 p-4 transition hover:border-primary/25 hover:bg-surface"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                  {order.store.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{order.store.name}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {order.code} · {itemCount} {itemCount === 1 ? "producto" : "productos"} ·{" "}
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {order.store.comuna} · {order.deliveryMode === "PICKUP" ? "Retiro" : "Delivery"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono-nums text-sm font-semibold">
                    {formatCLP(order.total)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
