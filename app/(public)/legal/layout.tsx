import Link from "next/link";

const LINKS = [
  { href: "/legal/terminos", label: "Términos y condiciones" },
  { href: "/legal/privacidad", label: "Política de privacidad" },
  { href: "/legal/reembolsos", label: "Cancelaciones y reembolsos" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Legal
          </p>
          <nav className="mt-4 space-y-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="mt-6 text-[10px] leading-relaxed text-muted/70">
            Documentos preliminares. La versión final debe ser revisada por un
            abogado antes del lanzamiento comercial.
          </p>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
