/**
 * Creates or updates an organising-team account.
 *
 *   npm run admin:create -- --email lead@example.org --name "Team Lead" --role admin
 *
 * The password is read from the ADMIN_PASSWORD environment variable (never a
 * CLI argument, so it doesn't end up in shell history). Roles: admin | reviewer.
 * Use --disable to deactivate an account.
 */
import { query, queryOne } from "../src/lib/db";
import { hashPasswordForScript } from "./password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = arg("name") ?? process.env.ADMIN_NAME ?? email;
  const role = arg("role") ?? process.env.ADMIN_ROLE ?? "admin";
  const disable = process.argv.includes("--disable");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Provide a valid --email");
  if (!["admin", "reviewer"].includes(role)) throw new Error("--role must be admin or reviewer");

  if (disable) {
    await query(`UPDATE admin_users SET active = false WHERE email = $1`, [email]);
    await query(`DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE email = $1)`, [email]);
    console.log(`Disabled ${email}`);
    return;
  }

  const password = process.env.ADMIN_PASSWORD ?? "";
  if (password.length < 12) throw new Error("Set ADMIN_PASSWORD (at least 12 characters)");

  const hash = await hashPasswordForScript(password);
  const row = await queryOne<{ id: string }>(
    `INSERT INTO admin_users (email, name, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, active = true
     RETURNING id`,
    [email, name, hash, role],
  );
  await query(`DELETE FROM admin_sessions WHERE user_id = $1`, [row!.id]);
  await query(`INSERT INTO audit_logs (actor_email, action, target_type, target_id, meta) VALUES ('cli', 'admin_user.upsert', 'admin_user', $1, $2::jsonb)`, [
    row!.id,
    JSON.stringify({ email, role }),
  ]);
  console.log(`Saved ${role} account for ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
