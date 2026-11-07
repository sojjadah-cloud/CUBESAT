import { Pencil } from "lucide-react";
import type { ApplicationData, ExperienceKey, StepId } from "@/lib/application";
import { EXPERIENCE_KEYS } from "@/lib/application";
import type { Dictionary, Locale } from "@/lib/i18n";
import { ACADEMIC_LEVELS, WEEKLY_HOURS, departmentLabel, optionLabel } from "@/lib/institution";
import { skillById, teamName } from "@/lib/teams";

export interface SummaryFile {
  id: string;
  kind: "image" | "cv";
  name: string;
  size: number;
  href?: string;
}

function Section({
  title,
  step,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  step?: StepId;
  onEdit?: (s: StepId) => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-3">
        <h2 className="text-[16px] font-bold">{title}</h2>
        {onEdit && step && (
          <button type="button" onClick={() => onEdit(step)} className="btn-ghost btn-sm -me-2 text-signal hover:text-ink" aria-label={`${editLabel}: ${title}`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {editLabel}
          </button>
        )}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(140px,220px)_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-[13px] text-ink-muted">{k}</dt>
          <dd className="text-[14px] text-ink [overflow-wrap:anywhere]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const Ltr = ({ children }: { children: React.ReactNode }) => (
  <span dir="ltr" className="ltr">
    {children}
  </span>
);

export function ApplicationSummary({
  data,
  files,
  t,
  locale,
  onEdit,
  showStudent = true,
}: {
  data: ApplicationData;
  files: SummaryFile[];
  t: Dictionary;
  locale: Locale;
  onEdit?: (s: StepId) => void;
  showStudent?: boolean;
}) {
  const r = t.review;
  const f = t.experience.fields;
  const none = <span className="text-ink-faint">{r.noneProvided}</span>;
  const val = (v: string | null | undefined) => (v && v.trim() ? v : none);

  const entryLines = (key: ExperienceKey, e: Record<string, string>) => {
    switch (key) {
      case "workshops":
        return { title: e.title, meta: [e.organiser, e.year], extra: [[f.topics, e.topics], [f.skills, e.skills]] };
      case "courses":
        return {
          title: e.name,
          meta: [e.provider, e.year],
          extra: [[f.mainSkills, e.skills], [f.certificate, e.certificate ? (e.certificate === "yes" ? t.common.yes : t.common.no) : ""]],
        };
      case "competitions":
        return {
          title: e.name,
          meta: [e.organiser, e.year, e.scope ? f.scopes[e.scope as keyof typeof f.scopes] : "", e.mode ? (e.mode === "team" ? f.team : f.individual) : ""],
          extra: [[f.result, e.result], [f.role, e.role]],
        };
      case "projects":
        return {
          title: e.name,
          meta: [e.role],
          extra: [[f.description, e.description], [f.technologies, e.technologies], [f.outcome, e.outcome], [f.url, e.url]],
        };
    }
  };

  return (
    <div className="space-y-4">
      <Section title={r.teams} step="teams" onEdit={onEdit} editLabel={t.common.edit}>
        <Rows
          rows={[
            [r.category, data.category === "technical" ? t.category.technical.title : data.category ? t.category.nonTechnical.title : "—"],
            [t.teams.chosen, <span key="p" className="font-semibold text-orbit-ink">{teamName(data.primaryTeam, locale)}</span>],
          ]}
        />
      </Section>

      {showStudent && (
        <Section title={r.student} step="student" onEdit={onEdit} editLabel={t.common.edit}>
          <Rows
            rows={[
              [t.student.fullName, data.fullName],
              [t.student.studentId, <Ltr key="id">{data.studentId}</Ltr>],
              [t.student.academicLevel, optionLabel(ACADEMIC_LEVELS, data.academicLevel, locale)],
              [t.student.department, departmentLabel(data.department, null, locale)],
              [t.student.specialisation, data.specialisation],
              [t.student.phone, <Ltr key="ph">{data.phone}</Ltr>],
            ]}
          />
        </Section>
      )}

      <Section title={r.experience} step="experience" onEdit={onEdit} editLabel={t.common.edit}>
        <div className="mb-6 border-b border-line/70 pb-5">
          <h3 className="mb-2 text-[14px] font-semibold text-ink">{r.skills}</h3>
          {data.skills.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {data.skills.map((id) => (
                <li key={id} className="rounded-md border border-line px-2.5 py-1 text-[13px] text-ink-muted" dir="auto">
                  {skillById(id)?.label[locale] ?? id}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-faint">{r.none}</p>
          )}
          {data.skillsOther?.trim() && <p className="mt-2 text-[13px] text-ink-muted" dir="auto">{t.motivation.skillsOther}: {data.skillsOther}</p>}
        </div>
        <div className="space-y-5">
          {EXPERIENCE_KEYS.map((key) => {
            const g = data.experience[key];
            return (
              <div key={key}>
                <h3 className="text-[14px] font-semibold text-ink">{t.experience.groups[key].title}</h3>
                {g.has && g.entries.length ? (
                  <ul className="mt-2 space-y-2.5">
                    {g.entries.map((raw) => {
                      const e = entryLines(key, raw as unknown as Record<string, string>);
                      const extras = e.extra.filter(([, v]) => v && v.trim());
                      return (
                        <li key={raw.id} className="rounded-[10px] border border-line/70 bg-space-950/40 px-4 py-3">
                          <p className="text-[14px] font-medium text-ink">{e.title}</p>
                          <p className="text-[13px] text-ink-muted">{e.meta.filter(Boolean).join(" · ")}</p>
                          {extras.length > 0 && (
                            <dl className="mt-2 space-y-1 text-[13px]">
                              {extras.map(([k, v]) => (
                                <div key={k} className="flex flex-wrap gap-x-2">
                                  <dt className="text-ink-faint">{k}:</dt>
                                  <dd className="text-ink-muted [overflow-wrap:anywhere]" dir="auto">{v}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-1 text-[13px] text-ink-faint">{g.has === null ? "—" : r.noExperience}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 border-t border-line/70 pt-5">
          <h3 className="mb-3 text-[14px] font-semibold text-ink">{r.motivation}</h3>
          <Rows
            rows={[
              [t.motivation.why, <span key="w" className="whitespace-pre-line" dir="auto">{val(data.motivationWhy)}</span>],
              [t.motivation.contribute, <span key="c" className="whitespace-pre-line" dir="auto">{val(data.motivationContribute)}</span>],
              [t.motivation.learn, <span key="l" className="whitespace-pre-line" dir="auto">{val(data.motivationLearn)}</span>],
              [t.motivation.hours, optionLabel(WEEKLY_HOURS, data.weeklyHours, locale) || none],
            ]}
          />
        </div>
      </Section>

      <Section title={r.attachments} step="attachments" onEdit={onEdit} editLabel={t.common.edit}>
        {files.length ? (
          <ul className="space-y-1.5 text-[14px]">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3">
                {file.href ? (
                  <a href={file.href} target="_blank" rel="noopener noreferrer" className="truncate text-signal underline-offset-4 hover:underline" dir="auto">
                    {file.name}
                  </a>
                ) : (
                  <span className="truncate" dir="auto">{file.name}</span>
                )}
                <span className="shrink-0 text-[12px] text-ink-faint">
                  {file.kind === "cv" ? t.attachments.cvTitle : t.attachments.imagesTitle}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-ink-faint">{r.none}</p>
        )}
      </Section>
    </div>
  );
}
