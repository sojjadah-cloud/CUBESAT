import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight, FileText, Phone } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { query } from "@/lib/db";
import { getApplication, rowToData } from "@/lib/admin-data";
import { getServerDictionary } from "@/lib/server-locale";
import { teamName } from "@/lib/teams";
import { ApplicationSummary } from "@/components/ApplicationSummary";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PrintButton } from "@/components/admin/PrintButton";
import { DeleteApplication, NoteForm, StatusForm } from "@/components/admin/ApplicationActions";
import { formatSize } from "@/lib/format";
import type { Status } from "@/lib/application";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminPage();
  const { t, locale } = await getServerDictionary();
  const a = t.admin;
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const [files, notes, others] = await Promise.all([
    query<{ id: string; kind: "image" | "cv"; original_name: string; size_bytes: number; mime: string }>(
      `SELECT id, kind, original_name, size_bytes, mime FROM files WHERE application_id = $1 ORDER BY kind, created_at`,
      [id],
    ),
    query<{ id: string; author_name: string | null; body: string; created_at: Date }>(
      `SELECT id, author_name, body, created_at FROM application_notes WHERE application_id = $1 ORDER BY created_at DESC`,
      [id],
    ),
    // The same student may apply to several teams; link their other applications.
    query<{ id: string; reference: string; primary_team: string; status: Status }>(
      `SELECT id, reference, primary_team, status FROM applications WHERE student_id_norm = $1 AND id <> $2 ORDER BY created_at`,
      [app.student_id_norm, id],
    ),
  ]);

  const h = await headers();
  await audit(user, "application.view", { type: "application", id }, null, process.env.TRUST_PROXY === "true" ? h.get("x-forwarded-for")?.split(",")[0] ?? null : "local");

  const data = rowToData(app);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div>
      <Link href="/admin/applications" className="btn-ghost btn-sm -ms-3 no-print">
        <Back className="h-4 w-4" aria-hidden="true" />
        {a.backToList}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line/70 pb-6">
        <div>
          <p className="eyebrow">{a.report}</p>
          <h1 className="mt-2 text-[28px] font-bold">{app.full_name}</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            <span dir="ltr" className="font-display">{app.reference}</span> · {a.submitted} {fmt.format(new Date(app.created_at))}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-muted">
            <span className="font-semibold text-orbit-ink">{teamName(app.primary_team, locale)}</span>
            <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ink">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span dir="ltr">{app.phone}</span>
            </a>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={app.status} label={t.status[app.status]} />
          <PrintButton label={a.printReport} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] print:block">
        {/* Every answer the student gave, in the same order as the form. */}
        <div className="min-w-0">
          <ApplicationSummary
            data={data}
            t={t}
            locale={locale}
            files={files.map((f) => ({ id: f.id, kind: f.kind, name: f.original_name, size: f.size_bytes, href: `/api/admin/files/${f.id}` }))}
          />
        </div>

        <aside className="space-y-4 no-print">
          <section className="panel p-5">
            <StatusForm id={app.id} status={app.status} />
          </section>

          {others.length > 0 && (
            <section className="panel p-5" aria-labelledby="others-h">
              <h2 id="others-h" className="text-[15px] font-semibold">{a.otherApplications}</h2>
              <ul className="mt-3 space-y-2">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/applications/${o.id}`} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-[13px] hover:border-orbit">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{teamName(o.primary_team, locale)}</span>
                        <span className="text-[12px] text-ink-faint" dir="ltr">{o.reference}</span>
                      </span>
                      <StatusBadge status={o.status} label={t.status[o.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel p-5" aria-labelledby="files-h">
            <h2 id="files-h" className="text-[15px] font-semibold">{a.files}</h2>
            {files.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-faint">{a.noFiles}</p>
            ) : (
              <>
                {files.some((f) => f.kind === "image") && (
                  <ul className="mt-3 grid grid-cols-3 gap-2">
                    {files.filter((f) => f.kind === "image").map((f) => (
                      <li key={f.id}>
                        <a href={`/api/admin/files/${f.id}`} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-line hover:border-signal">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/api/admin/files/${f.id}`} alt={f.original_name} className="aspect-square w-full object-cover" loading="lazy" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="mt-3 space-y-2">
                  {files.filter((f) => f.kind === "cv").map((f) => (
                    <li key={f.id} className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
                      <FileText className="h-5 w-5 shrink-0 text-orbit-ink" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px]" dir="auto">{f.original_name}</span>
                        <span className="text-[12px] text-ink-faint">{formatSize(f.size_bytes, t)}</span>
                      </span>
                      <a href={`/api/admin/files/${f.id}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">{a.open}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="panel p-5" aria-labelledby="notes-h">
            <h2 id="notes-h" className="text-[15px] font-semibold">{a.notes}</h2>
            <p className="mt-0.5 text-[12px] text-ink-faint">{a.notesHint}</p>
            <div className="mt-3">
              <NoteForm id={app.id} />
            </div>
            {notes.length === 0 ? (
              <p className="mt-4 text-[13px] text-ink-faint">{a.noNotes}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-line/70 bg-space-950/40 px-3 py-2.5">
                    <p className="whitespace-pre-line text-[13px] text-ink" dir="auto">{n.body}</p>
                    <p className="mt-1.5 text-[11px] text-ink-faint">{n.author_name ?? "—"} · {fmt.format(new Date(n.created_at))}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {user.role === "admin" && (
            <section className="panel p-5">
              <DeleteApplication id={app.id} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
