import { currentAdmin, destroySession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp, forbidden, json, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentAdmin();
  await destroySession();
  if (user) await audit(user, "auth.logout", { type: "admin_user", id: user.id }, null, clientIp(req));
  return json({ ok: true });
}
