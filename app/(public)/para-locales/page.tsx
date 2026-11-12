import Link from "next/link";
import { ArrowRight, BarChart3, Bike, Check, ShieldCheck, Store, UtensilsCrossed } from "lucide-react";

export const metadata = {
  title: "Para locales",
  description:
    "Comisión desde 12%, logística híbrida y tus clientes siguen siendo tuyos. Súmate a MesaCerca.",
};

const PLANS = [
  {
    name: "Cocina",
    price: "12%",
    suffix: "+ IVA",
    description: "Para locales que ya tienen su propio reparto.",
    features: [
      "Vitrina y pedidos en MesaCerca",
      "Menú y stock autoadministrado",
      "Pagos semanales",
      "Analítica básica",
      "Sin exclusividad",
    ],
    highlight: false,
  },
  {
    name: "Híbrido",
    price: "17%",
    suffix: "+ IVA",
    description: "Para locales que quieren flexibilidad de reparto.",
    features: [
      "Todo lo del plan Cocina",
      "Reparto propio o red MesaCerca",
      "Tracking en tiempo real",
      "Asignación de repartidores",
      "Soporte operativo",
    ],
    highlight: true,
  },
  {
    name: "Full",
    price: "22%",
    suffix: "+ IVA",
    description: "Para locales que quieren delegar toda la logística.",
    features: [
      "Todo lo del plan Híbrido",
      "Prioridad de asignación",
      "Soporte dedicado",
      "Reportes avanzados",
      "Onboarding asistido",
    ],
    highlight: false,
  },
];

export default function ParaLocalesPage() {
  return (
    <div>
      <section className="border-b border-border bg-[radial-gradient(ellipse_at_top_right,rgba(240,185,11,0.1),transparent_55%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <Store className="h-3.5 w-3.5" />
              Para cocinas y restaurantes
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Tu cocina, tus reglas.
              <br />
              <span className="text-primary">Tu margen.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
              MesaCerca te da demanda, herramientas y logística sin quedarse con tu
              cliente. Comisión publicada, sin exclusividad y sin cláusulas de
              precio mínimo.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/registro/local" className="btn btn-primary btn-lg">
                Registrar mi cocina
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
          <Benefit
            icon={UtensilsCrossed}
            title="Menú sin fricción"
            description="Carga categorías, platos, precios, fotos y stock. Marca agotados en un clic."
          />
          <Benefit
            icon={Bike}
            title="Reparto a tu manera"
            description="Entrega con tu propio equipo o solicita un repartidor MesaCerca cuando lo necesites."
          />
          <Benefit
            icon={BarChart3}
            title="Datos que importan"
            description="Ventas, ticket promedio, platos top y tiempos de preparación en un dashboard claro."
          />
        </div>
      </section>

      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Planes simples. Sin letra chica.
            </h2>
            <p className="mt-2 text-sm text-muted">
              La comisión se calcula sobre el subtotal de productos. No sobre envío,
              propina ni impuestos. Sin costo de inscripción.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlight
                    ? "border-primary/40 bg-primary/5 ring-glow"
                    : "border-border bg-surface/60"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-ink">
                    Recomendado
                  </span>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {plan.name}
                </p>
                <p className="mt-2 font-display text-4xl font-extrabold text-primary font-mono-nums">
                  {plan.price}
                  <span className="ml-1 text-xs font-medium text-muted">{plan.suffix}</span>
                </p>
                <p className="mt-2 text-xs text-muted">{plan.description}</p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro/local"
                  className={`btn mt-6 w-full ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
                >
                  Elegir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Lo que no vas a encontrar en MesaCerca
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Cláusulas de precio mínimo o exclusividad.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Comisiones escondidas por “visibilidad” o “pago”.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Retención de tus clientes o de tus datos.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Publicidad que se confunde con resultados orgánicos.
              </li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="font-display text-lg font-bold">¿Cómo empiezo?</h3>
            <ol className="mt-4 space-y-3 text-sm text-muted">
              <li><span className="font-mono-nums text-primary">01</span> Crea tu cuenta y registra tu local.</li>
              <li><span className="font-mono-nums text-primary">02</span> Carga tu menú y configura horarios.</li>
              <li><span className="font-mono-nums text-primary">03</span> Verificamos tus documentos.</li>
              <li><span className="font-mono-nums text-primary">04</span> Activa tu local y empieza a recibir pedidos.</li>
            </ol>
            <Link href="/registro/local" className="btn btn-primary mt-6 w-full">
              Empezar ahora
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Benefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Store;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
