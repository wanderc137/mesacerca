import { redirect } from "next/navigation";
import { BadgeCheck, Clock, ShieldAlert } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { startKycAction } from "@/app/actions/kyc";
import { requireUser } from "@/lib/auth";
import { getKycCase, kycRequired, kycProvider } from "@/lib/kyc";

export const dynamic = "force-dynamic";

export default async function KycPage() {
  const user = await requireUser("/kyc");
  if (user.role === "ADMIN" || user.role === "SUPPORT") redirect("/admin/kyc");
  if (user.role !== "MERCHANT" && user.role !== "COURIER") redirect("/");

  const record = await getKycCase(
    user.id,
    user.role as "MERCHANT" | "COURIER",
  );
  const status = record?.status ?? "NOT_STARTED";
  const provider = kycProvider();

  return (
    <DashboardShell role={user.role} user={{ name: user.name, email: user.email }}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Verificación
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Identidad y liveness
          </h1>
          <p className="mt-1 text-sm text-muted">
            La verificación protege a clientes, locales y repartidores. En
            producción se realiza con un proveedor especializado.
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {status === "APPROVED" ? (
                <BadgeCheck className="h-5 w-5" />
              ) : status === "PENDING" ? (
                <Clock className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </span>
            <div className="flex-1">
              <p className="font-semibold">
                {status === "APPROVED"
                  ? "Verificación aprobada"
                  : status === "PENDING"
                    ? "Verificación en revisión"
                    : status === "REJECTED"
                      ? "Verificación rechazada"
                      : "Verificación pendiente"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {status === "APPROVED"
                  ? "Tu identidad fue validada. Ya puedes operar según las reglas de tu rol."
                  : status === "PENDING"
                    ? "Estamos revisando tu caso. Te avisaremos cuando termine."
                    : status === "REJECTED"
                      ? record?.reason ?? "El caso fue rechazado. Puedes intentarlo de nuevo."
                      : kycRequired()
                        ? "Necesitas completar la verificación para operar en producción."
                        : "Verificación recomendada antes de operar con clientes reales."}
              </p>

              {status !== "APPROVED" && status !== "PENDING" && (
                <form action={startKycAction} className="mt-4">
                  <button type="submit" className="btn btn-primary">
                    {provider === "mock"
                      ? "Iniciar verificación (demo)"
                      : "Iniciar verificación"}
                  </button>
                </form>
              )}

              {provider === "mock" && (
                <p className="mt-4 rounded-lg border border-border bg-surface-2/50 p-3 text-[11px] text-muted">
                  Modo demo: no se captura selfie ni documento. Un administrador
                  revisa el caso manualmente. Para liveness real configura
                  `KYC_PROVIDER=didit` y sus credenciales.
                </p>
              )}

              {provider === "didit" && !["APPROVED", "PENDING"].includes(status) && (
                <p className="mt-4 rounded-lg border border-border bg-surface-2/50 p-3 text-[11px] text-muted">
                  Serás redirigido a Didit para documento, selfie y prueba de
                  vida. El resultado vuelve por webhook y queda en revisión
                  administrativa.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
