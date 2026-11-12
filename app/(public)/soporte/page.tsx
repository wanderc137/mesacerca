import Link from "next/link";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Soporte",
  description: "Ayuda con pedidos, pagos, locales y repartidores en MesaCerca.",
};

const FAQ = [
  {
    q: "¿Cómo sigo mi pedido?",
    a: "Entra a “Mis pedidos”, abre el pedido activo y verás el estado, el mapa y el PIN de entrega.",
  },
  {
    q: "¿Qué pasa si mi pedido llega mal o incompleto?",
    a: "Escríbenos con tu código de pedido y una foto. Abrimos el caso y resolvemos en menos de 48 horas.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Puedes cancelar sin costo antes de que el local acepte. Después, depende del estado y del local.",
  },
  {
    q: "¿Cómo pago?",
    a: "Con Mercado Pago, Webpay o efectivo al recibir. El desglose completo se muestra antes de pagar.",
  },
  {
    q: "Soy local, ¿cómo me sumo?",
    a: "Registra tu cocina en /registro/local. Verificamos tus documentos y activamos tu local.",
  },
  {
    q: "Soy repartidor, ¿cómo empiezo?",
    a: "Regístrate en /registro/repartidor. Verificamos identidad y vehículo antes de activar tu cuenta.",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Soporte
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Estamos para ayudarte
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Problemas con un pedido, un pago o tu cuenta. Respondemos de lunes a
          domingo, de 09:00 a 23:00.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href="mailto:soporte@mesacerca.cl" className="card p-5 transition hover:border-primary/30">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="mt-3 font-display text-base font-semibold">Email</h2>
          <p className="mt-1 text-sm text-muted">soporte@mesacerca.cl</p>
          <p className="mt-1 text-[11px] text-muted">Respuesta en menos de 24 horas.</p>
        </a>
        <div className="card p-5">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="mt-3 font-display text-base font-semibold">WhatsApp</h2>
          <p className="mt-1 text-sm text-muted">+56 9 0000 0000</p>
          <p className="mt-1 text-[11px] text-muted">Horario operativo. Número de ejemplo.</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold tracking-tight">Preguntas frecuentes</h2>
        <div className="mt-4 space-y-2">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl border border-border bg-surface/60 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                {item.q}
                <span className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <p>
          Si tu problema es urgente y afecta una entrega en curso, incluye el
          código del pedido en el asunto. Así lo priorizamos.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/" className="btn btn-secondary">Volver al inicio</Link>
      </div>
    </div>
  );
}
