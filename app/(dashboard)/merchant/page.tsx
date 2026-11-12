import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, Clock, ShoppingBag, Store, UtensilsCrossed } from "lucide-react";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMerchantOrders } from "@/lib/merchant/orders";
import { StatCard } from "@/components/ui/stat-card";
import { MerchantOrdersBoard } from "@/components/merchant/merchant-orders-board";
import { formatCLP } from "@/lib/utils";
import { ACTIVE_ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/merchant");

  const merchant = await db.merchant.findUnique({
    where: { ownerId: session.id },
    include: { stores: { orderBy: { createdAt: "asc" } } },
  });
  if (!merchant) redirect("/registro/local");

  const orders = await getMerchantOrders(merchant.id);
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today,
  );
  const paidToday = todayOrders.filter(
    (order) => order.paymentStatus === "PAID" && !order.status.startsWith("CANCELLED"),
  );
  const salesToday = paidToday.reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter((order) =>
    ACTIVE_ORDER_STATUSES.includes(order.status),
  );
  const pending = orders.filter((order) => order.status === "PENDING_MERCHANT");
  const avgTicket = paidToday.length ? salesToday / paidToday.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Panel del local
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            {merchant.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {merchant.stores.length} {merchant.stores.length === 1 ? "sucursal" : "sucursales"} ·{" "}
            Plan {merchant.commissionPlan} · {merchant.status === "VERIFIED" ? "Verificado" : "En revisión"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/merchant/menu" className="btn btn-secondary">
            <UtensilsCrossed className="h-4 w-4" />
            Editar menú
          </Link>
          <Link href="/merchant/analytics" className="btn btn-primary">
            Ver analítica
          </Link>
        </div>
      </div>

      {merchant.status !== "VERIFIED" && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">Tu local está en revisión</p>
          <p className="mt-1 text-xs text-muted">
            Puedes cargar tu menú y configurar tu local. Un administrador verificará
            tus documentos antes de activar los pedidos.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pedidos hoy"
          value={String(todayOrders.length)}
          hint={`${activeOrders.length} activos`}
          icon={ShoppingBag}
          tone="primary"
        />
        <StatCard
          label="Ventas hoy"
          value={formatCLP(salesToday)}
          hint={`${paidToday.length} pagados`}
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Ticket promedio"
          value={formatCLP(avgTicket)}
          hint="Pedidos pagados hoy"
          icon={Store}
          tone="info"
        />
        <StatCard
          label="Por aceptar"
          value={String(pending.length)}
          hint="Necesitan tu respuesta"
          icon={Clock}
          tone={pending.length > 0 ? "danger" : "default"}
        />
      </div>

      {merchant.stores.length > 1 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {merchant.stores.map((store) => (
            <div key={store.id} className="card-soft flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xl">
                {store.emoji}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{store.name}</p>
                <p className="text-[11px] text-muted">
                  {store.comuna} · {store.status === "ACTIVE" ? "Activo" : store.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <MerchantOrdersBoard
        initialOrders={orders}
        stores={merchant.stores.map((store) => ({
          id: store.id,
          name: store.name,
          emoji: store.emoji,
        }))}
      />
    </div>
  );
}
