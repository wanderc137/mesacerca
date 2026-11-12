export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateRuntimeEnv } = await import("./lib/env");
  validateRuntimeEnv();
}
