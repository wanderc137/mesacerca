import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://server.arcgisonline.com https://*.arcgisonline.com",
  "font-src 'self' data:",
  `connect-src 'self'${isProduction ? "" : " ws: wss: http: https:"}`,
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

// Páginas con datos de sesión, MFA, KYC o direcciones nunca deben quedar en
// cachés compartidas (Cloudflare, Caddy, navegador intermedio).
const noStorePagePatterns = [
  "/admin",
  "/admin/:path*",
  "/merchant",
  "/merchant/:path*",
  "/courier",
  "/courier/:path*",
  "/kyc",
  "/kyc/:path*",
  "/mfa",
  "/mfa/:path*",
  "/settings",
  "/settings/:path*",
  "/order/:path*",
  "/checkout",
  "/orders",
  "/login",
  "/register",
  "/registro/:path*",
  "/verify-email",
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  ...(isProduction
    ? {}
    : { allowedDevOrigins: ["192.0.2.92", "localhost", "127.0.0.1"] }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["transbank-sdk", "mercadopago"],
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...noStorePagePatterns.map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
        ],
      })),
    ];
  },
};

export default nextConfig;
