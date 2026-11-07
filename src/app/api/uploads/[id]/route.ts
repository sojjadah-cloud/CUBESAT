import { query, queryOne } from "@/lib/db";
import { getDraft } from "@/lib/drafts";
import { deleteFile, readFile } from "@/lib/files";
import { forbidden, json, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/** Applicants may only access files attached to their own, not-yet-submitted draft. */
async function ownFile(id: string) {
  if (!UUID.test(id)) return null;
  const draft = await getDraft(false);
  if (!draft) return null;
  return queryOne<{ id: string; storage_key: string; mime: string }>(
    `SELECT id, storage_key, mime FROM files WHERE id = $1 AND draft_id = $2 AND application_id IS NULL`,
    [id, draft.id],
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const file = await ownFile((await params).id);
  if (!file || !file.mime.startsWith("image/")) return json({ error: "not_found" }, 404);
  const buf = await readFile(file.storage_key);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return forbidden();
  const file = await ownFile((await params).id);
  if (!file) return json({ error: "not_found" }, 404);
  await query(`DELETE FROM files WHERE id = $1`, [file.id]);
  await deleteFile(file.storage_key);
  return json({ ok: true });
}
