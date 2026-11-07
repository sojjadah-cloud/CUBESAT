import { requireAdminPage } from "@/lib/auth";
import { query } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-locale";

export default async function AuditPage() {
  await requireAdminPage(["admin"]);
  const { t, locale } = await getServerDictionary();
  const a = t.admin;
  const rows = await query<{ id: string; actor_email: string | null; action: string; target_type: string | null; target_id: string | null; meta: unknown; ip: string | null; created_at: Date }>(
    `SELECT id::text, actor_email, action, target_type, target_id, meta, ip, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 300`,
  );
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "short", timeStyle: "medium" });

  return (
    <div>
      <h1 className="text-[26px] font-bold">{a.audit}</h1>
      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-[12px] text-ink-muted">
              <th scope="col" className="px-4 py-3 text-start font-medium">{a.time}</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">{a.actor}</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">{a.action}</th>
              <th scope="col" className="px-4 py-3 text-start font-medium">{a.target}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">{fmt.format(new Date(r.created_at))}</td>
                <td className="px-4 py-2.5" dir="ltr">{r.actor_email ?? "—"}</td>
                <td className="px-4 py-2.5 font-medium text-ink">{a.actions[r.action] ?? r.action}</td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {r.target_type ? (a.targets[r.target_type] ?? r.target_type) : "—"}
                  {r.target_id && <span className="ms-2 text-ink-faint" dir="ltr">#{r.target_id.slice(0, 8)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
