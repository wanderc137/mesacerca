import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { verifyEmailAction } from "@/app/actions/verification";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const params = await searchParams;
  const rawStatus = params.status;
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return (
    <AuthShell
      eyebrow="Cuenta"
      title={
        status === "ok"
          ? "Email verificado"
          : status === "invalid"
            ? "Enlace inválido"
            : "Verifica tu email"
      }
      subtitle={
        status === "ok"
          ? "Tu correo quedó confirmado. Ya puedes usar MesaCerca con normalidad."
          : status === "invalid"
            ? "El enlace venció o ya fue usado. Solicita uno nuevo desde tu panel."
            : "Confirma tu correo para proteger tu cuenta y recuperar el acceso."
      }
      footer={
        <p className="text-center text-[11px] text-muted">
          <Link href="/login" className="text-primary hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      }
    >
      {status === "ok" ? (
        <Link href="/" className="btn btn-primary w-full">
          Ir a MesaCerca
        </Link>
      ) : token ? (
        <form action={verifyEmailAction}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn btn-primary w-full">
            Confirmar mi email
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">
          Abre el enlace que enviamos a tu correo o solicita uno nuevo desde tu
          panel de seguridad.
        </p>
      )}
    </AuthShell>
  );
}
