import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function notFound() {
  return new Response("No encontrado.", { status: 404 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Solo se sirven portadas de locales. Evita exponer rutas internas,
  // archivos de configuración o traversals.
  if (
    segments.length !== 2 ||
    segments[0] !== "stores" ||
    !/^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(segments[1])
  ) {
    return notFound();
  }

  const extension = segments[1].split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return notFound();

  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "stores",
    segments[1],
  );

  try {
    const buffer = await readFile(filePath);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return notFound();
  }
}
