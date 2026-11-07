import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
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
  /** Signed in automatically because the portal was opened on this computer. */
  local?: boolean;
}

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

// Compared against when the email doesn't exist, so response timing doesn't reveal valid accounts.
let dummyHash: Promise<string> | null = null;

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
  const row = await queryOne<AdminUser & { password_hash: string; active: boolean }>(
    `SELECT id, email, name, role, password_hash, active FROM admin_users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  dummyHash ??= bcrypt.hash(randomToken(), 12);
  const ok = await bcrypt.compare(password, row?.password_hash ?? (await dummyHash));
  if (!row || !ok || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

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

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

/** True when this request may use the portal without signing in (opt-in, development, same computer only). */
export function isLocalAccessHost(host: string | null) {
  if (process.env.ADMIN_LOCAL_ACCESS !== "true" || process.env.NODE_ENV === "production") return false;
  const name = (host ?? "").toLowerCase().replace(/:\d+$/, "");
  return LOCAL_HOSTS.includes(name);
}

async function localAccessUser(): Promise<AdminUser | null> {
  if (!isLocalAccessHost((await headers()).get("host"))) return null;
  const user = await queryOne<AdminUser>(
    `SELECT id, email, name, role FROM admin_users WHERE active AND role = 'admin' ORDER BY created_at LIMIT 1`,
  );
  return user ? { ...user, local: true } : null;
}

export async function currentAdmin(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return localAccessUser();
  const session = await queryOne<AdminUser>(
    `SELECT u.id, u.email, u.name, u.role
       FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [sha256(token)],
  );
  return session ?? localAccessUser();
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
