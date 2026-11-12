import { AuthShell } from "@/components/auth/auth-shell";
import { AuthLinks, RegisterCustomerForm } from "@/components/auth/forms";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Crea tu cuenta"
      title="Pide comida local"
      subtitle="Guarda tus direcciones, sigue tus pedidos y califica a las cocinas que te gustan."
      footer={<AuthLinks type="register" />}
    >
      <RegisterCustomerForm />
    </AuthShell>
  );
}
