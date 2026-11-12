import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MesaCerca · Comida local a tu puerta",
    short_name: "MesaCerca",
    description:
      "Pide comida de las mejores cocinas de Santiago. Precio claro, entrega confiable y comisión justa para el local.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0E11",
    theme_color: "#F0B90B",
    orientation: "portrait",
    lang: "es-CL",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
