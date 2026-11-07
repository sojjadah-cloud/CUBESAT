import { queryOne } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { STATUSES, type Status } from "@/lib/application";
import { clientIp, forbidden, json, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return forbidden();
  const user = await requireAdminApi();
  if (!user) return json({ error: "unauthorized" }, 401);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status as Status;
  if (!STATUSES.includes(status) || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "invalid" }, 400);

  const before = await queryOne<{ status: string }>(`SELECT status FROM applications WHERE id = $1`, [id]);
  if (!before) return json({ error: "not_found" }, 404);
  await queryOne(`UPDATE applications SET status = $1, updated_at = now() WHERE id = $2`, [status, id]);
  await audit(user, "application.status_change", { type: "application", id }, { from: before.status, to: status }, clientIp(req));
  return json({ ok: true });
}
