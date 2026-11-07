/**
 * Data-retention job. Run on a schedule (e.g. daily cron):
 *
 *   npm run retention:purge
 *
 * - Deletes expired drafts and their uploaded files.
 * - Deletes files that belong to neither a draft nor an application.
 * - If APPLICATION_RETENTION_DAYS is set, deletes applications (and their
 *   notes and files) older than that many days.
 */
import { query } from "../src/lib/db";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.env.UPLOAD_DIR ?? "storage/uploads");
const remove = (key: string) => fs.rm(path.join(root, key), { force: true });

async function main() {
  const draftFiles = await query<{ storage_key: string }>(
    `DELETE FROM files WHERE application_id IS NULL AND draft_id IN (SELECT id FROM drafts WHERE expires_at < now()) RETURNING storage_key`,
  );
  const drafts = await query(`DELETE FROM drafts WHERE expires_at < now() RETURNING id`);
  const orphans = await query<{ storage_key: string }>(
    `DELETE FROM files WHERE application_id IS NULL AND draft_id IS NULL AND created_at < now() - interval '1 day' RETURNING storage_key`,
  );

  let apps: { id: string }[] = [];
  let appFiles: { storage_key: string }[] = [];
  const days = Number(process.env.APPLICATION_RETENTION_DAYS);
  if (Number.isFinite(days) && days > 0) {
    appFiles = await query<{ storage_key: string }>(
      `SELECT f.storage_key FROM files f JOIN applications a ON a.id = f.application_id WHERE a.created_at < now() - make_interval(days => $1)`,
      [days],
    );
    apps = await query<{ id: string }>(`DELETE FROM applications WHERE created_at < now() - make_interval(days => $1) RETURNING id`, [days]);
  }

  await Promise.all([...draftFiles, ...orphans, ...appFiles].map((f) => remove(f.storage_key)));
  await query(`DELETE FROM admin_sessions WHERE expires_at < now()`);
  await query(
    `INSERT INTO audit_logs (actor_email, action, meta) VALUES ('system', 'retention.purge', $1::jsonb)`,
    [JSON.stringify({ drafts: drafts.length, applications: apps.length, files: draftFiles.length + orphans.length + appFiles.length })],
  );
  console.log(`Purged ${drafts.length} drafts, ${apps.length} applications, ${draftFiles.length + orphans.length + appFiles.length} files.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
