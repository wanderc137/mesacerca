import Link from "next/link";
import { ArrowRight, Bike, Clock, MapPin, ShieldCheck, Sparkles, Store, UtensilsCrossed } from "lucide-react";
import { db } from "@/lib/db";
import { CUISINE_NAMES, CUISINES, SANTIAGO_COMUNAS } from "@/lib/constants";
import { StoreCard } from "@/components/store/store-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string | string[];
  comuna?: string | string[];
  cuisine?: string | string[];
}>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (first(params.q)?.trim() ?? "").slice(0, 80);
  const comuna = (first(params.comuna) ?? "").slice(0, 80);
  const cuisine = (first(params.cuisine) ?? "").slice(0, 80);

  const where = {
    status: "ACTIVE",
    merchant: { status: "VERIFIED" },
    ...(comuna ? { comuna } : {}),
    ...(cuisine ? { cuisine } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { cuisine: { contains: q } },
            { description: { contains: q } },
            { comuna: { contains: q } },
          ],
        }
      : {}),
  };

  const [stores, totalStores, avgPrep] = await Promise.all([
    db.store.findMany({
      where,
      orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
      take: 48,
    }),
    db.store.count({
      where: { status: "ACTIVE", merchant: { status: "VERIFIED" } },
    }),
    db.store.aggregate({
      where: { status: "ACTIVE", merchant: { status: "VERIFIED" } },
      _avg: { prepTimeMin: true },
    }),
  ]);

  const featured = !q && !comuna && !cuisine ? stores.slice(0, 8) : [];
  const list = q || comuna || cuisine ? stores : stores.slice(8);
  const activeFilters = [q, comuna, cuisine].filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,185,11,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(255,122,26,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Santiago completo · 34 comunas
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              La cocina local,
              <br />
              <span className="text-primary">a tu puerta.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Comida de verdad, de cocinas de barrio y restaurantes que aman lo
              que hacen. Precio claro, entrega confiable y una comisión justa
              para el local.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="#cocinas" className="btn btn-primary btn-lg">
                Ver cocinas
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/registro/local" className="btn btn-secondary btn-lg">
                <Store className="h-4 w-4" />
                Soy cocina
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-success" />
                Locales verificados
              </span>
              <span className="flex items-center gap-1.5">
                <Bike className="h-4 w-4 text-primary" />
                Reparto propio o MesaCerca
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-info" />
                {Math.round(avgPrep._avg.prepTimeMin ?? 25)} min promedio
              </span>
            </div>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            <HeroStat value={String(totalStores)} label="cocinas activas" />
            <HeroStat value={String(SANTIAGO_COMUNAS.length)} label="comunas" />
            <HeroStat value="12%" label="comisión desde" accent />
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="border-b border-border bg-surface/30">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 no-scrollbar">
          <Link
            href="/"
            className={`badge shrink-0 ${
              !cuisine ? "badge-primary" : "badge-muted hover:badge-primary"
            }`}
          >
            Todas
          </Link>
          {CUISINE_NAMES.map((name) => (
            <Link
              key={name}
              href={`/?cuisine=${encodeURIComponent(name)}`}
              className={`badge shrink-0 ${
                cuisine === name ? "badge-primary" : "badge-muted"
              }`}
            >
              <span>{CUISINES[name].emoji}</span>
              {name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Filtros:</span>
            {q && <span className="badge badge-primary">“{q}”</span>}
            {comuna && <span className="badge badge-info">{comuna}</span>}
            {cuisine && <span className="badge badge-info">{cuisine}</span>}
            <Link href="/" className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline">
              Limpiar
            </Link>
          </div>
        )}

        {featured.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Destacadas de la semana
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Las cocinas mejor valoradas por la comunidad.
                </p>
              </div>
              <Link href="#cocinas" className="text-xs font-semibold text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </section>
        )}

        <section id="cocinas">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {activeFilters.length > 0 ? "Resultados" : "Todas las cocinas"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {stores.length} {stores.length === 1 ? "cocina" : "cocinas"} para pedir ahora.
              </p>
            </div>
            <Link href="/registro/local" className="hidden text-xs font-semibold text-primary hover:underline sm:block">
              ¿Tienes una cocina? Súmate
            </Link>
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No encontramos cocinas con esos filtros"
              description="Prueba con otra comuna, otro tipo de comida o limpia los filtros."
              action={<Link href="/" className="btn btn-primary">Ver todo Santiago</Link>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="mt-16 rounded-2xl border border-border bg-surface/50 p-6 sm:p-10">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Pedir es simple. Y transparente.
            </h2>
            <p className="mt-2 text-sm text-muted">
              Sin cargos escondidos. Sin letra chica. Tú decides cuánto dejar de propina.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Step
              number="01"
              title="Elige tu cocina"
              description="Filtra por comuna, antojo o rating. Revisa el menú, los precios y el tiempo real."
            />
            <Step
              number="02"
              title="Paga seguro"
              description="Mercado Pago, Webpay o efectivo. El desglose completo antes de confirmar."
            />
            <Step
              number="03"
              title="Sigue tu pedido"
              description="El local prepara, el repartidor se asigna y tú ves todo en el mapa."
            />
          </div>
        </section>

        {/* Merchant CTA */}
        <section className="mt-8 grid gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Para cocinas y restaurantes
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Tu cocina, tus reglas.
              <br />
              <span className="text-primary">Comisión desde 12%.</span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Carga tu menú, recibe pedidos y decide si entregas tú o usas
              nuestra red de repartidores. Sin exclusividad. Sin cláusulas de
              precio mínimo. Tus clientes son tuyos.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/registro/local" className="btn btn-primary">
                Registrar mi cocina
              </Link>
              <Link href="/para-locales" className="btn btn-secondary">
                Ver planes
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Comisión" value="12%" hint="plan Cocina" />
            <MiniStat label="Pedido mínimo" value="$0" hint="sin letra chica" />
            <MiniStat label="Pago" value="Semanal" hint="miércoles" />
            <MiniStat label="Exclusividad" value="No" hint="vende donde quieras" />
          </div>
        </section>

        {/* Coverage */}
        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">
                Cobertura en todo Santiago
              </h2>
              <p className="mt-1 text-sm text-muted">
                Estamos sumando cocinas en las 34 comunas. Si no ves la tuya, avísanos.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SANTIAGO_COMUNAS.map((item) => (
              <Link
                key={item.name}
                href={`/?comuna=${encodeURIComponent(item.name)}`}
                className={`badge ${
                  item.name === comuna ? "badge-primary" : "badge-muted"
                } hover:border-primary/30 hover:text-primary`}
              >
                <MapPin className="h-3 w-3" />
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroStat({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-4 py-3 backdrop-blur">
      <p className={`font-display text-2xl font-bold font-mono-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg/40 p-5">
      <span className="font-mono-nums text-xs font-bold text-primary">{number}</span>
      <h3 className="mt-2 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-primary font-mono-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
    </div>
  );
}
