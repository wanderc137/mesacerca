/* eslint-disable react-hooks/purity */
import Link from "next/link";
import { AlertTriangle, Banknote, ClipboardList, Store, Users } from "lucide-react";
import { db } from "@/lib/db";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCLP, formatNumber, timeAgo } from "@/lib/utils";
import { ACTIVE_ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const [orders, merchants, couriers, totalMerchants, totalCouriers] =
    await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: since } },
        include: {
          store: { select: { name: true, emoji: true } },
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      db.merchant.findMany({
        where: { status: "PENDING" },
        include: { stores: { select: { name: true, comuna: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      db.courier.findMany({
        where: { verificationStatus: "PENDING" },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
      db.merchant.count(),
      db.courier.count(),
    ]);

  const paid = orders.filter(
    (order) => order.paymentStatus === "PAID" && !order.status.startsWith("CANCELLED"),
  );
  const gmv = paid.reduce((sum, order) => sum + order.total, 0);
  const commission = paid.reduce((sum, order) => sum + order.commissionAmount, 0);
  const active = orders.filter((order) =>
    ACTIVE_ORDER_STATUSES.includes(order.status),
  );
  const cancelled = orders.filter((order) => order.status.startsWith("CANCELLED"));
  const cancellationRate = orders.length ? (cancelled.length / orders.length) * 100 : 0;
  const staleMerchant = orders.filter(
    (order) =>
      order.status === "PENDING_MERCHANT" &&
      Date.now() - order.createdAt.getTime() > 5 * 60 * 1000,
  );
  const staleCourier = orders.filter(
    (order) =>
      order.status === "PENDING_COURIER" &&
      Date.now() - order.createdAt.getTime() > 15 * 60 * 1000,
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Administración
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
          Operación de Santiago
        </h1>
        <p className="mt-1 text-sm text-muted">
          Últimos 30 días · {formatNumber(orders.length)} pedidos ·{" "}
          {formatNumber(totalMerchants)} locales · {formatNumber(totalCouriers)} repartidores
        </p>
      </div>

      {process.env.PAYMENTS_MODE !== "production" && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Pagos en modo <span className="font-semibold text-primary">{process.env.PAYMENTS_MODE ?? "mock"}</span>.
            Para cobrar de verdad, configura Mercado Pago y Transbank y cambia
            <span className="font-mono-nums"> PAYMENTS_MODE=production</span>.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GMV" value={formatCLP(gmv)} hint="Pedidos pagados" icon={Banknote} tone="success" />
        <StatCard label="Comisión" value={formatCLP(commission)} hint="Ingreso MesaCerca" icon={Store} tone="primary" />
        <StatCard label="Pedidos activos" value={String(active.length)} hint="En operación" icon={ClipboardList} tone="info" />
        <StatCard
          label="Cancelación"
          value={`${cancellationRate.toFixed(1)}%`}
          hint={`${cancelled.length} cancelados`}
          icon={AlertTriangle}
          tone={cancellationRate > 5 ? "danger" : "default"}
        />
      </div>

      {(merchants.length > 0 || couriers.length > 0 || staleMerchant.length > 0 || staleCourier.length > 0) && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Requieren atención
            </h2>
            <div className="mt-3 space-y-2">
              {staleMerchant.length > 0 && (
                <AlertRow
                  label={`${staleMerchant.length} pedidos sin aceptar hace más de 5 min`}
                  href="/admin/orders"
                  tone="danger"
                />
              )}
              {staleCourier.length > 0 && (
                <AlertRow
                  label={`${staleCourier.length} pedidos sin repartidor hace más de 15 min`}
                  href="/admin/orders"
                  tone="danger"
                />
              )}
              {merchants.length > 0 && (
                <AlertRow
                  label={`${merchants.length} locales pendientes de verificación`}
                  href="/admin/merchants"
                  tone="primary"
                />
              )}
              {couriers.length > 0 && (
                <AlertRow
                  label={`${couriers.length} repartidores pendientes de verificación`}
                  href="/admin/couriers"
                  tone="primary"
                />
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <Users className="h-4 w-4 text-info" />
              Verificaciones pendientes
            </h2>
            <div className="mt-3 space-y-2">
              {merchants.slice(0, 3).map((merchant) => (
                <div key={merchant.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{merchant.name}</p>
                    <p className="text-[10px] text-muted">
                      {merchant.stores[0]?.comuna ?? "Sin comuna"}
                    </p>
                  </div>
                  <Link href="/admin/merchants" className="text-[10px] font-semibold text-primary">
                    Revisar
                  </Link>
                </div>
              ))}
              {couriers.slice(0, 3).map((courier) => (
                <div key={courier.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{courier.user.name}</p>
                    <p className="text-[10px] text-muted">{courier.vehicle} · {courier.zone}</p>
                  </div>
                  <Link href="/admin/couriers" className="text-[10px] font-semibold text-primary">
                    Revisar
                  </Link>
                </div>
              ))}
              {merchants.length === 0 && couriers.length === 0 && (
                <p className="py-4 text-center text-xs text-muted">Todo al día.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold">Pedidos recientes</h2>
            <p className="mt-0.5 text-xs text-muted">Últimos 200 pedidos del período</p>
          </div>
          <Link href="/admin/orders" className="btn btn-secondary btn-sm">
            Ver todos
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Local</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Creado</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 12).map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/order/${order.id}`} className="font-mono-nums text-xs text-primary hover:underline">
                      {order.code}
                    </Link>
                  </td>
                  <td className="text-xs">
                    <span className="mr-1">{order.store.emoji}</span>
                    {order.store.name}
                  </td>
                  <td className="text-xs">{order.customer.name}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td><StatusBadge status={order.paymentStatus} kind="payment" /></td>
                  <td className="text-xs text-muted">{timeAgo(order.createdAt)}</td>
                  <td className="text-right font-mono-nums text-xs font-semibold">
                    {formatCLP(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  label,
  href,
  tone,
}: {
  label: string;
  href: string;
  tone: "danger" | "primary";
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
        tone === "danger"
          ? "border-danger/20 bg-danger/5 text-danger"
          : "border-primary/20 bg-primary/5 text-primary"
      }`}
    >
      <span>{label}</span>
      <span>Ver →</span>
    </Link>
  );
}
