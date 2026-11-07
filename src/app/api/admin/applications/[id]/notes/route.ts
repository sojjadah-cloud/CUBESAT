import { queryOne } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp, forbidden, json, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return forbidden();
  const user = await requireAdminApi();
  if (!user) return json({ error: "unauthorized" }, 401);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 2000 || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "invalid" }, 400);

  const exists = await queryOne(`SELECT 1 FROM applications WHERE id = $1`, [id]);
  if (!exists) return json({ error: "not_found" }, 404);
  const note = await queryOne<{ id: string }>(
    `INSERT INTO application_notes (application_id, author_id, author_name, body) VALUES ($1, $2, $3, $4) RETURNING id`,
    [id, user.id, user.name, text],
  );
  await audit(user, "application.note_added", { type: "application", id }, { noteId: note?.id }, clientIp(req));
  return json({ ok: true }, 201);
}
