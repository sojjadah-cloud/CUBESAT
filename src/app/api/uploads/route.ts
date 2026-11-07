import { query, queryOne } from "@/lib/db";
import { getDraft } from "@/lib/drafts";
import { LIMITS, allowedFor, deleteFile, maxBytes, safeName, sniff, storeFile, type FileKind } from "@/lib/files";
import { clientIp, forbidden, json, rateLimit, sameOrigin, tooMany } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  if (!rateLimit(`upload:${clientIp(req)}`, 30, 60_000)) return tooMany();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const kind = form.get("kind");
  const file = form.get("file");
  if ((kind !== "image" && kind !== "cv") || !(file instanceof File)) return json({ error: "invalid" }, 400);
  if (file.size === 0) return json({ error: "type" }, 400);
  if (file.size > maxBytes(kind as FileKind)) return json({ error: "size" }, 413);

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !allowedFor(kind as FileKind, type.mime)) return json({ error: "type" }, 415);

  const draft = (await getDraft(true))!;

  if (kind === "image") {
    const row = await queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM files WHERE draft_id = $1 AND application_id IS NULL AND kind = 'image'`,
      [draft.id],
    );
    if ((row?.n ?? 0) >= LIMITS.maxImages) return json({ error: "count" }, 409);
  } else {
    // A new CV replaces the previous one.
    const old = await query<{ storage_key: string }>(
      `DELETE FROM files WHERE draft_id = $1 AND application_id IS NULL AND kind = 'cv' RETURNING storage_key`,
      [draft.id],
    );
    await Promise.all(old.map((o) => deleteFile(o.storage_key)));
  }

  const key = await storeFile(buf, type.ext);
  const name = safeName(file.name);
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO files (draft_id, kind, original_name, mime, size_bytes, storage_key)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [draft.id, kind, name, type.mime, buf.length, key],
  );
  return json({ id: inserted!.id, kind, name, size: buf.length, mime: type.mime }, 201);
}
