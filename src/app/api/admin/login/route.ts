import { createSession, verifyCredentials } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp, forbidden, json, rateLimit, sameOrigin, tooMany } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const ip = clientIp(req);
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return json({ error: "invalid_login" }, 401);

  if (!rateLimit(`login-ip:${ip}`, 20, 15 * 60_000) || !rateLimit(`login-email:${email}`, 8, 15 * 60_000)) {
    return tooMany();
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    await audit(null, "auth.login_failed", { type: "admin_user" }, { email }, ip);
    return json({ error: "invalid_login" }, 401);
  }
  await createSession(user, ip, req.headers.get("user-agent"));
  await audit(user, "auth.login", { type: "admin_user", id: user.id }, null, ip);
  return json({ ok: true });
}
