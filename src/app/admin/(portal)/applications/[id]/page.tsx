import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, ArrowRight, FileText, Phone } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { query } from "@/lib/db";
import { getApplication, rowToData } from "@/lib/admin-data";
import { getServerDictionary } from "@/lib/server-locale";
import { ACADEMIC_LEVELS, departmentLabel, optionLabel } from "@/lib/institution";
import { EXPERIENCE_KEYS } from "@/lib/application";
import { ApplicationSummary } from "@/components/ApplicationSummary";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteApplication, NoteForm, StatusForm } from "@/components/admin/ApplicationActions";
import { formatSize } from "@/lib/format";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminPage();
  const { t, locale } = await getServerDictionary();
  const a = t.admin;
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();

  const [files, notes] = await Promise.all([
    query<{ id: string; kind: "image" | "cv"; original_name: string; size_bytes: number; mime: string }>(
      `SELECT id, kind, original_name, size_bytes, mime FROM files WHERE application_id = $1 ORDER BY kind, created_at`,
      [id],
    ),
    query<{ id: string; author_name: string | null; body: string; created_at: Date }>(
      `SELECT id, author_name, body, created_at FROM application_notes WHERE application_id = $1 ORDER BY created_at DESC`,
      [id],
    ),
  ]);

  const h = await headers();
  await audit(user, "application.view", { type: "application", id }, null, process.env.TRUST_PROXY === "true" ? h.get("x-forwarded-for")?.split(",")[0] ?? null : "local");

  const data = rowToData(app);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const expCounts = EXPERIENCE_KEYS.map((k) => ({ k, n: app.experience?.[k]?.has ? app.experience[k].entries.length : 0 }));

  return (
    <div>
      <Link href="/admin/applications" className="btn-ghost btn-sm -ms-3">
        <Back className="h-4 w-4" aria-hidden="true" />
        {a.backToList}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-line/70 pb-6">
        <div>
          <p className="eyebrow">{a.profile}</p>
          <h1 className="mt-2 text-[28px] font-bold">{app.full_name}</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            <span dir="ltr" className="font-display">{app.reference}</span> · {a.submitted} {fmt.format(new Date(app.created_at))}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-muted">
            
            <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ink"><Phone className="h-4 w-4" aria-hidden="true" /><span dir="ltr">{app.phone}</span></a>
          </div>
        </div>
        <StatusBadge status={app.status} label={t.status[app.status]} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">
          <section className="panel p-5 sm:p-6">
            <h2 className="text-[16px] font-bold">{t.review.student}</h2>
            <dl className="mt-4 grid gap-4 text-[14px] sm:grid-cols-3">
              <div><dt className="text-[12px] text-ink-muted">{t.student.studentId}</dt><dd dir="ltr" className="ltr">{app.student_id}</dd></div>
              <div><dt className="text-[12px] text-ink-muted">{t.student.academicLevel}</dt><dd>{optionLabel(ACADEMIC_LEVELS, app.academic_level, locale)}</dd></div>
              <div><dt className="text-[12px] text-ink-muted">{t.student.department}</dt><dd>{departmentLabel(app.department, app.department_other, locale)}</dd></div>
              <div className="sm:col-span-3"><dt className="text-[12px] text-ink-muted">{t.student.specialisation}</dt><dd>{app.specialisation_other ?? app.specialisation}</dd></div>
            </dl>
            <div className="mt-5 border-t border-line/70 pt-4">
              <h3 className="text-[13px] font-semibold text-ink-muted">{a.experienceSummary}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {expCounts.map(({ k, n }) => (
                  <li key={k} className={`rounded-md border px-2.5 py-1 text-[13px] ${n ? "border-signal/50 text-ink" : "border-line text-ink-faint"}`}>
                    {t.experience.groups[k].title}: <span className="font-semibold tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <ApplicationSummary
            data={data}
            showStudent={false}
            t={t}
            locale={locale}
            files={files.map((f) => ({ id: f.id, kind: f.kind, name: f.original_name, size: f.size_bytes, href: `/api/admin/files/${f.id}` }))}
          />
        </div>

        <aside className="space-y-4">
          <section className="panel p-5">
            <StatusForm id={app.id} status={app.status} />
          </section>

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
