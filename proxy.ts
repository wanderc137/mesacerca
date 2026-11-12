import { NextResponse, type NextRequest } from "next/server";

const DEV_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://192.0.2.92:8081",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
  "http://192.0.2.92:8082",
  "http://localhost:8083",
  "http://127.0.0.1:8083",
];

function allowedOrigins() {
  const origins = new Set<string>();
  const configured = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const value of configured) origins.add(value);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // Ignorar URL inválida; el arranque la valida en producción.
    }
  }

  if (process.env.NODE_ENV !== "production") {
    for (const value of DEV_ORIGINS) origins.add(value);
  }
  return origins;
}

const ALLOWED_ORIGINS = allowedOrigins();

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const originAllowed = !origin || ALLOWED_ORIGINS.has(origin);
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);

  if (origin && !originAllowed && isMutation) {
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: originAllowed && origin ? 204 : 403,
      headers: origin && originAllowed ? corsHeaders(origin) : { Vary: "Origin" },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  if (origin && originAllowed) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
