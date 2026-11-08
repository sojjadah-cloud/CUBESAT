import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, queryOne } from "@/lib/db";
import { randomToken, sha256, secureCookies } from "@/lib/security";

export const SESSION_COOKIE = "cs_admin";
const SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS ?? 8);

export type Role = "admin" | "reviewer";
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Sign-in is by email only (an owner decision): any active admin account's
 * email opens a session. Accounts are created with `npm run admin:create`.
 */
export async function findActiveAdmin(email: string): Promise<AdminUser | null> {
  const normalised = email.trim().toLowerCase();
  const user = await queryOne<AdminUser & { active: boolean }>(
    `SELECT id, email, name, role, active FROM admin_users WHERE email = $1`,
    [normalised],
  );
  if (user) return user.active ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
  // ADMIN_EMAILS (comma-separated, e.g. set in Netlify's environment variables) creates
  // admin accounts on first sign-in, for hosts where `npm run admin:create` can't be run.
  if (!adminEmailsFromEnv().includes(normalised)) return null;
  return queryOne<AdminUser>(
    `INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1, $2, '!', 'admin')
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, name, role`,
    [normalised, normalised.split("@")[0]],
  );
}

const adminEmailsFromEnv = () =>
  [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function createSession(user: AdminUser, ip: string, userAgent: string | null) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await query(
    `INSERT INTO admin_sessions (token_hash, user_id, ip, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5)`,
    [sha256(token), user.id, ip, userAgent?.slice(0, 300) ?? null, expires],
  );
  await query(`UPDATE admin_users SET last_login_at = now() WHERE id = $1`, [user.id]);
  await query(`DELETE FROM admin_sessions WHERE expires_at < now()`);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function currentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return queryOne<AdminUser>(
    `SELECT u.id, u.email, u.name, u.role
       FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [sha256(token)],
  );
}

/** For server components: redirect to login when not signed in. */
export async function requireAdminPage(roles: Role[] = ["admin", "reviewer"]): Promise<AdminUser> {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) redirect("/admin");
  return user;
}

/** For route handlers: returns the user, or null when unauthenticated/unauthorised. */
export async function requireAdminApi(roles: Role[] = ["admin", "reviewer"]): Promise<AdminUser | null> {
  const user = await currentAdmin();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
