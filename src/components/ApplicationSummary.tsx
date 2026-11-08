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

/** Question and answer on the same line; the question is tinted so the two are easy to tell apart. */
function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line/70 overflow-hidden rounded-[10px] border border-line/70">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
          <dt className="h-full bg-orbit/[0.08] px-3 py-2.5 text-[13px] font-semibold text-orbit-ink">{k}</dt>
          <dd className="px-3 py-2.5 text-[14px] text-ink [overflow-wrap:anywhere]">{v}</dd>
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

  const fileList = (list: SummaryFile[]) =>
    list.length ? (
      <ul className="space-y-1">
        {list.map((file) => (
          <li key={file.id} className="truncate" dir="auto">
            {file.href ? (
              <a href={file.href} target="_blank" rel="noopener noreferrer" className="text-signal underline underline-offset-4">
                {file.name}
              </a>
            ) : (
              file.name
            )}
          </li>
        ))}
      </ul>
    ) : (
      none
    );

  // Only a validated linkedin.com address is turned into a link.
  const linkedinHref = (() => {
    const v = data.linkedin?.trim();
    if (!v) return null;
    try {
      const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      return /(^|\.)linkedin\.com$/i.test(u.hostname) ? u.href : null;
    } catch {
      return null;
    }
  })();

  const entryRows = (key: ExperienceKey, raw: Record<string, string>): [string, React.ReactNode][] => {
    // Older drafts used per-type fields; fall back to them so nothing is lost.
    const name = raw.name || raw.title || "";
    const where = raw.where || raw.organiser || raw.provider || "";
    const rows: [string, React.ReactNode][] = [
      [f.name[key], name],
      [f.where, where],
    ];
    if (raw.details?.trim()) rows.push([f.details, <span key="d" className="whitespace-pre-line" dir="auto">{raw.details}</span>]);
    return rows;
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
        <Rows
          rows={[
            [
              r.skills,
              data.skills.length ? (
                <ul key="s" className="flex flex-wrap gap-1.5">
                  {data.skills.map((id) => (
                    <li key={id} className="rounded-md border border-line bg-white px-2 py-0.5 text-[13px]" dir="auto">
                      {skillById(id)?.label[locale] ?? id}
                    </li>
                  ))}
                </ul>
              ) : (
                none
              ),
            ],
            [t.motivation.skillsOther, <span key="o" dir="auto">{val(data.skillsOther)}</span>],
          ]}
        />
        <div className="mt-5 space-y-4">
          {EXPERIENCE_KEYS.map((key) => {
            const g = data.experience[key];
            return (
              <div key={key}>
                <h3 className="text-[14px] font-semibold text-ink">{t.experience.groups[key].title}</h3>
                {g.has && g.entries.length ? (
                  <div className="mt-2 space-y-2.5">
                    {g.entries.map((entry) => (
                      <Rows key={entry.id} rows={entryRows(key, entry as unknown as Record<string, string>)} />
                    ))}
                  </div>
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
        <Rows
          rows={[
            [t.attachments.imagesTitle, fileList(files.filter((f) => f.kind === "image"))],
            [t.attachments.cvTitle, fileList(files.filter((f) => f.kind === "cv"))],
            [
              t.attachments.linkedinTitle,
              linkedinHref ? (
                <a key="li" href={linkedinHref} target="_blank" rel="noopener noreferrer" className="text-signal underline underline-offset-4" dir="ltr">
                  {data.linkedin.trim()}
                </a>
              ) : (
                none
              ),
            ],
          ]}
        />
      </Section>
    </div>
  );
}
