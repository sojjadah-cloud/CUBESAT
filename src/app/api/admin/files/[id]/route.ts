import { queryOne } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { contentDisposition, readFile } from "@/lib/files";
import { clientIp, json } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminApi();
  if (!user) return json({ error: "unauthorized" }, 401);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "not_found" }, 404);

  const file = await queryOne<{ storage_key: string; mime: string; original_name: string; application_id: string }>(
    `SELECT storage_key, mime, original_name, application_id FROM files WHERE id = $1 AND application_id IS NOT NULL`,
    [id],
  );
  if (!file) return json({ error: "not_found" }, 404);

  const buf = await readFile(file.storage_key);
  await audit(user, "file.view", { type: "file", id }, { applicationId: file.application_id }, clientIp(req));
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": contentDisposition("inline", file.original_name),
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; object-src 'self'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
