import Link from "next/link";
import { ArrowRight, Bike, Clock, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { formatCLP } from "@/lib/utils";
import { COURIER_BASE_PAYOUT, COURIER_PER_KM } from "@/lib/constants";

export const metadata = {
  title: "Para repartidores",
  description:
    "Trabaja cuando quieras, cobra lo que ves y recibe el 100% de tu propina. Súmate a la red MesaCerca.",
};

export default function ParaRepartidoresPage() {
  return (
    <div>
      <section className="border-b border-border bg-[radial-gradient(ellipse_at_top_left,rgba(240,185,11,0.1),transparent_55%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <Bike className="h-3.5 w-3.5" />
              Para repartidores
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Trabaja cuando quieras.
              <br />
              <span className="text-primary">Cobra lo que ves.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
              Sin letra chica, sin propinas retenidas y con una tarifa clara antes
              de aceptar. Tú decides cuándo conectarte y cuándo parar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/registro/repartidor" className="btn btn-primary btn-lg">
                Quiero repartir
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-base font-semibold">Tarifa transparente</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Base de {formatCLP(COURIER_BASE_PAYOUT)} + {formatCLP(COURIER_PER_KM)} por km.
              La propina es 100% tuya.
            </p>
          </div>
          <div className="card p-5">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-base font-semibold">Horario libre</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Conéctate cuando te acomode. Sin turnos obligatorios ni penalización
              por desconectarte.
            </p>
          </div>
          <div className="card p-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-base font-semibold">Cobertura y soporte</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Seguro por hora activa, soporte humano y protocolo claro ante
              incidentes.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              ¿Cómo funciona?
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                "Regístrate con tus datos y documentos.",
                "Verificamos tu identidad y tu vehículo.",
                "Conéctate en tu zona y recibe ofertas cercanas.",
                "Acepta, retira y entrega con PIN o foto.",
                "Cobra semanalmente, con el detalle de cada entrega.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-muted">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono-nums text-[10px] font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-lg font-bold">Ejemplo de pago</h2>
            <p className="mt-1 text-xs text-muted">Entrega de 3 km, sin espera adicional.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Base</span>
                <span className="font-mono-nums">{formatCLP(COURIER_BASE_PAYOUT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Distancia (3 km)</span>
                <span className="font-mono-nums">{formatCLP(COURIER_PER_KM * 3)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Pago base</span>
                <span className="font-mono-nums text-primary">
                  {formatCLP(COURIER_BASE_PAYOUT + COURIER_PER_KM * 3)}
                </span>
              </div>
              <div className="flex justify-between text-success">
                <span>Propina (100% tuya)</span>
                <span className="font-mono-nums">+ lo que deje el cliente</span>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] text-muted">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Las ofertas muestran local, distancia, pago y tiempo estimado antes
              de aceptar.
            </div>
            <Link href="/registro/repartidor" className="btn btn-primary mt-5 w-full">
              Crear mi cuenta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
