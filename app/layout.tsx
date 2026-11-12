import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "MesaCerca · Comida local a tu puerta",
    template: "%s · MesaCerca",
  },
  description:
    "Pide comida de las mejores cocinas de Santiago. Precio claro, entrega confiable y comisión justa para el local.",
  applicationName: "MesaCerca",
  keywords: ["delivery", "comida", "Santiago", "cocinas", "pedidos"],
  authors: [{ name: "MesaCerca" }],
  openGraph: {
    title: "MesaCerca · Comida local a tu puerta",
    description:
      "Pide comida de las mejores cocinas de Santiago. Precio claro, entrega confiable y comisión justa para el local.",
    type: "website",
    locale: "es_CL",
    siteName: "MesaCerca",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-CL"
      className={`${inter.variable} ${manrope.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
