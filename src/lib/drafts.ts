import { cookies } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { randomToken, sha256, secureCookies } from "@/lib/security";

export const DRAFT_COOKIE = "cs_draft";
const DRAFT_DAYS = Number(process.env.DRAFT_RETENTION_DAYS ?? 30);

export interface DraftRow {
  id: string;
  data: Record<string, unknown>;
  updated_at: Date;
}

/** Returns the applicant's current draft (identified by an httpOnly cookie), optionally creating one. */
export async function getDraft(create: boolean): Promise<DraftRow | null> {
  const jar = await cookies();
  const token = jar.get(DRAFT_COOKIE)?.value;
  if (token) {
    const row = await queryOne<DraftRow>(
      `SELECT id, data, updated_at FROM drafts WHERE token_hash = $1 AND expires_at > now()`,
      [sha256(token)],
    );
    if (row) return row;
  }
  if (!create) return null;

  const fresh = randomToken();
  const expires = new Date(Date.now() + DRAFT_DAYS * 86400_000);
  const row = await queryOne<DraftRow>(
    `INSERT INTO drafts (token_hash, expires_at) VALUES ($1, $2) RETURNING id, data, updated_at`,
    [sha256(fresh), expires],
  );
  jar.set(DRAFT_COOKIE, fresh, { httpOnly: true, secure: secureCookies, sameSite: "lax", path: "/", expires });
  return row;
}

export async function clearDraftCookie() {
  (await cookies()).delete(DRAFT_COOKIE);
}

export async function draftFiles(draftId: string) {
  return query<{ id: string; kind: "image" | "cv"; original_name: string; size_bytes: number; mime: string }>(
    `SELECT id, kind, original_name, size_bytes, mime FROM files
      WHERE draft_id = $1 AND application_id IS NULL ORDER BY created_at`,
    [draftId],
  );
}
