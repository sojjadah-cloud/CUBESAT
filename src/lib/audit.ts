import { query } from "@/lib/db";
import type { AdminUser } from "@/lib/auth";

export async function audit(
  actor: Pick<AdminUser, "id" | "email"> | null,
  action: string,
  target: { type?: string; id?: string } = {},
  meta: Record<string, unknown> | null = null,
  ip: string | null = null,
) {
  await query(
    `INSERT INTO audit_logs (actor_id, actor_email, action, target_type, target_id, meta, ip)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [actor?.id ?? null, actor?.email ?? null, action, target.type ?? null, target.id ?? null, meta ? JSON.stringify(meta) : null, ip],
  );
}
