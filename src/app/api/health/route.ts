import { queryOne } from "@/lib/db";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Deployment check: reports whether the database is reachable, without exposing any connection details. */
export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NETLIFY_DB_URL: Boolean(process.env.NETLIFY_DB_URL),
    NETLIFY_DATABASE_URL: Boolean(process.env.NETLIFY_DATABASE_URL),
    adminEmailSet: Boolean(process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS),
  };
  try {
    await queryOne("SELECT 1");
    return json({ database: "ok", env });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const notConfigured = (e.message ?? "").startsWith("No database configured");
    return json({ database: notConfigured ? "not_configured" : "error", code: e.code ?? null, env }, 503);
  }
}
