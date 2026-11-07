"use client";

import { AlertCircle, BookOpen, FlaskConical, GraduationCap, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { ChoiceGroup, SelectField, StepHeading, TextAreaField, TextField } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { EXPERIENCE_KEYS, MAX_ENTRIES, newEntry, type ExperienceKey } from "@/lib/application";
import type { Dictionary } from "@/lib/i18n";

type Spec = {
  key: string;
  label: (f: Dictionary["experience"]["fields"]) => string;
  kind?: "text" | "year" | "textarea" | "url" | "certificate" | "scope" | "mode";
  optional?: boolean;
  wide?: boolean;
};

const SPECS: Record<ExperienceKey, Spec[]> = {
  workshops: [
    { key: "title", label: (f) => f.title, wide: true },
    { key: "organiser", label: (f) => f.organiser },
    { key: "year", label: (f) => f.year, kind: "year" },
    { key: "topics", label: (f) => f.topics, optional: true },
    { key: "skills", label: (f) => f.skills, optional: true },
  ],
  courses: [
    { key: "name", label: (f) => f.courseName, wide: true },
    { key: "provider", label: (f) => f.provider },
    { key: "year", label: (f) => f.year, kind: "year" },
    { key: "skills", label: (f) => f.mainSkills, optional: true },
    { key: "certificate", label: (f) => f.certificate, kind: "certificate", optional: true },
  ],
  competitions: [
    { key: "name", label: (f) => f.competitionName, wide: true },
    { key: "organiser", label: (f) => f.competitionOrganiser },
    { key: "year", label: (f) => f.year, kind: "year" },
    { key: "scope", label: (f) => f.scope, kind: "scope", optional: true },
    { key: "mode", label: (f) => f.mode, kind: "mode", optional: true },
    { key: "result", label: (f) => f.result, optional: true },
    { key: "role", label: (f) => f.role, optional: true },
  ],
  projects: [
    { key: "name", label: (f) => f.projectName, wide: true },
    { key: "description", label: (f) => f.description, kind: "textarea", wide: true },
    { key: "technologies", label: (f) => f.technologies, optional: true },
    { key: "role", label: (f) => f.projectRole },
    { key: "outcome", label: (f) => f.outcome, optional: true },
    { key: "url", label: (f) => f.url, kind: "url", optional: true },
  ],
};

const ICONS: Record<ExperienceKey, typeof BookOpen> = {
  workshops: FlaskConical,
  courses: GraduationCap,
  competitions: Trophy,
  projects: BookOpen,
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));

function Group({ group }: { group: ExperienceKey }) {
  const { t } = useLocale();
  const { data, update, err, touch } = useWizard();
  const g = data.experience[group];
  const copy = t.experience.groups[group];
  const f = t.experience.fields;
  const Icon = ICONS[group];
  const base = `experience.${group}`;

  const setGroup = (patch: Partial<typeof g>) =>
    update((d) => ({ experience: { ...d.experience, [group]: { ...d.experience[group], ...patch } } }));

  const setHas = (has: boolean) =>
    setGroup({ has, entries: has && g.entries.length === 0 ? [newEntry(group, uid())] : g.entries } as Partial<typeof g>);

  const setField = (index: number, key: string, value: string) =>
    setGroup({ entries: g.entries.map((e, i) => (i === index ? { ...e, [key]: value } : e)) } as Partial<typeof g>);

  const add = () => setGroup({ entries: [...g.entries, newEntry(group, uid())] } as Partial<typeof g>);
  const remove = (index: number) => {
    const entries = g.entries.filter((_, i) => i !== index);
    setGroup({ entries, ...(entries.length === 0 ? { has: false } : {}) } as Partial<typeof g>);
  };

  const entriesError = err(`${base}.entries`);

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby={`${group}-title`}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-line bg-space-950/60">
          <Icon className="h-5 w-5 text-orbit-ink" aria-hidden="true" />
        </span>
        <h2 id={`${group}-title`} className="text-[18px] font-bold">
          {copy.title}
        </h2>
      </div>

      <div className="mt-5">
        <ChoiceGroup
          name={`${base}.has`}
          legend={copy.question}
          value={g.has === null ? "" : g.has ? "yes" : "no"}
          onChange={(v) => setHas(v === "yes")}
          options={[
            { value: "yes", label: copy.yes },
            { value: "no", label: copy.no },
          ]}
          error={err(`${base}.has`)}
        />
      </div>


      {g.has === true && (
        <div className="mt-6 space-y-5">
          {g.entries.map((entry, i) => (
            <fieldset key={entry.id} className="animate-fade-up rounded-[12px] border border-line/80 bg-space-950/40 p-4 sm:p-5">
              <legend className="sr-only">{`${copy.title} — ${t.experience.entry(i + 1)}`}</legend>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span aria-hidden="true" className="text-[14px] font-semibold text-ink-muted">{t.experience.entry(i + 1)}</span>
                <button type="button" onClick={() => remove(i)} className="btn-ghost btn-sm -me-2 text-[13px]">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {t.experience.removeEntry}
                </button>
              </div>
              <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                {SPECS[group].map((spec) => {
                  const name = `${base}.entries.${i}.${spec.key}`;
                  const value = (entry as unknown as Record<string, string>)[spec.key] ?? "";
                  const common = {
                    name,
                    label: spec.label(f),
                    optional: spec.optional,
                    error: err(name),
                    className: spec.wide ? "sm:col-span-2" : "",
                  };
                  const onChange = (v: string) => setField(i, spec.key, v);
                  const onBlur = () => touch(name);
                  switch (spec.kind) {
                    case "textarea":
                      return <TextAreaField key={spec.key} {...common} value={value} onChange={onChange} onBlur={onBlur} maxLength={1000} rows={3} />;
                    case "year":
                      return (
                        <TextField key={spec.key} {...common} value={value} onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 4))} onBlur={onBlur} inputMode="numeric" ltr maxLength={4} placeholder="2024" />
                      );
                    case "url":
                      return <TextField key={spec.key} {...common} value={value} onChange={onChange} onBlur={onBlur} type="url" inputMode="url" ltr placeholder={f.urlHint} maxLength={300} />;
                    case "certificate":
                      return (
                        <SelectField key={spec.key} {...common} value={value} onChange={onChange} options={[{ value: "yes", label: t.common.yes }, { value: "no", label: t.common.no }]} />
                      );
                    case "scope":
                      return (
                        <SelectField
                          key={spec.key}
                          {...common}
                          value={value}
                          onChange={onChange}
                          options={(["local", "national", "regional", "international"] as const).map((s) => ({ value: s, label: f.scopes[s] }))}
                        />
                      );
                    case "mode":
                      return (
                        <SelectField key={spec.key} {...common} value={value} onChange={onChange} options={[{ value: "team", label: f.team }, { value: "individual", label: f.individual }]} />
                      );
                    default:
                      return <TextField key={spec.key} {...common} value={value} onChange={onChange} onBlur={onBlur} maxLength={spec.optional ? 500 : 200} />;
                  }
                })}
              </div>
            </fieldset>
          ))}

          {entriesError && (
            <p className="field-error" role="alert">
              <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {entriesError}
            </p>
          )}

          {g.entries.length < MAX_ENTRIES && (
            <button type="button" onClick={add} className="btn-secondary btn-sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {g.entries.length ? t.experience.addAnother : t.experience.addFirst}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function ExperienceStep() {
  const { t } = useLocale();
  return (
    <div>
      <StepHeading title={t.experience.title} />
      <p className="mb-6 flex items-start gap-3 rounded-[12px] border border-signal/30 bg-signal/[0.07] px-4 py-3 text-[14px] text-ink">
        <Sparkles className="mt-[3px] h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
        {t.experience.beginners}
      </p>
      <div className="space-y-5">
        {EXPERIENCE_KEYS.map((k) => (
          <Group key={k} group={k} />
        ))}
      </div>
    </div>
  );
}
