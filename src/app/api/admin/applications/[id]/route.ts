import { query, queryOne } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { deleteFile } from "@/lib/files";
import { clientIp, forbidden, json, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Data-retention control: permanently removes an application, its notes and its files. Admins only. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return forbidden();
  const user = await requireAdminApi(["admin"]);
  if (!user) return json({ error: "forbidden" }, 403);

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "invalid" }, 400);
  const app = await queryOne<{ reference: string }>(`SELECT reference FROM applications WHERE id = $1`, [id]);
  if (!app) return json({ error: "not_found" }, 404);

  const files = await query<{ storage_key: string }>(`SELECT storage_key FROM files WHERE application_id = $1`, [id]);
  await query(`DELETE FROM applications WHERE id = $1`, [id]);
  await Promise.all(files.map((f) => deleteFile(f.storage_key)));
  await audit(user, "application.deleted", { type: "application", id }, { reference: app.reference, files: files.length }, clientIp(req));
  return json({ ok: true });
}
