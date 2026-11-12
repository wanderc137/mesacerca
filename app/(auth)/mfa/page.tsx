import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { MfaForm } from "@/components/auth/mfa-form";
import { getMfaPending } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const pending = await getMfaPending("login");
  if (!pending) redirect("/login");

  return (
    <AuthShell
      eyebrow="Seguridad"
      title="Verificación en dos pasos"
      subtitle={`Ingresa el código de 6 dígitos de tu app autenticadora para ${pending.email}.`}
      footer={
        <p className="text-center text-[11px] text-muted">
          ¿Problemas para entrar?{" "}
          <Link href="/soporte" className="text-primary hover:underline">
            Contacta a soporte
          </Link>
        </p>
      }
    >
      <MfaForm mode="login" />
    </AuthShell>
  );
}
