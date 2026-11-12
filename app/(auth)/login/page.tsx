import { AuthShell } from "@/components/auth/auth-shell";
import { AuthLinks, LoginForm } from "@/components/auth/forms";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const rawNext = params.next;
  const next = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  const showDemo =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <AuthShell
      eyebrow="Bienvenido de vuelta"
      title="Ingresa a MesaCerca"
      subtitle="Gestiona tus pedidos, tu local o tu ruta de reparto."
      footer={<AuthLinks type="login" />}
    >
      <LoginForm next={next} showDemo={showDemo} />
    </AuthShell>
  );
}
