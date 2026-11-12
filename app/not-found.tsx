import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo />
      <div className="mt-8 rounded-2xl border border-border bg-surface/60 p-8">
        <SearchX className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          No encontramos esta página
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Puede que el enlace haya cambiado o que el pedido ya no esté disponible.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-primary">Volver al inicio</Link>
          <Link href="/orders" className="btn btn-secondary">Mis pedidos</Link>
        </div>
      </div>
    </div>
  );
}
