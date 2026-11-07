import { query } from "@/lib/db";
import { getDraft, draftFiles, clearDraftCookie } from "@/lib/drafts";
import { deleteFile } from "@/lib/files";
import { clientIp, forbidden, json, rateLimit, sameOrigin, tooMany } from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_DRAFT_BYTES = 100_000;

export async function GET() {
  const draft = await getDraft(false);
  if (!draft) return json({ draft: null });
  const files = await draftFiles(draft.id);
  return json({
    draft: draft.data,
    files: files.map((f) => ({ id: f.id, kind: f.kind, name: f.original_name, size: f.size_bytes, mime: f.mime })),
    updatedAt: draft.updated_at,
  });
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  if (!rateLimit(`draft:${clientIp(req)}`, 120, 60_000)) return tooMany();

  const text = await req.text();
  if (text.length > MAX_DRAFT_BYTES) return json({ error: "too_large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid" }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid" }, 400);

  const draft = await getDraft(true);
  await query(`UPDATE drafts SET data = $1::jsonb, updated_at = now() WHERE id = $2`, [JSON.stringify(body), draft!.id]);
  return json({ ok: true, savedAt: new Date().toISOString() });
}

/** "Start over": deletes the draft and any files uploaded with it. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const draft = await getDraft(false);
  if (draft) {
    const files = await draftFiles(draft.id);
    await Promise.all(files.map(async (f) => {
      const [row] = await query<{ storage_key: string }>(`DELETE FROM files WHERE id = $1 RETURNING storage_key`, [f.id]);
      if (row) await deleteFile(row.storage_key);
    }));
    await query(`DELETE FROM drafts WHERE id = $1`, [draft.id]);
  }
  await clearDraftCookie();
  return json({ ok: true });
}
