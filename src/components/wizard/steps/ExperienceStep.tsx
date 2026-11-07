"use client";

import { AlertCircle, BookOpen, FlaskConical, GraduationCap, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { ChoiceGroup, StepHeading, TextAreaField, TextField } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { MotivationSection, SkillsSection } from "@/components/wizard/steps/SkillsSections";
import { EXPERIENCE_KEYS, MAX_ENTRIES, newEntry, type ExperienceKey } from "@/lib/application";

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
  const ph = t.experience.ph;
  const Icon = ICONS[group];
  const base = `experience.${group}`;

  const setGroup = (patch: Partial<typeof g>) =>
    update((d) => ({ experience: { ...d.experience, [group]: { ...d.experience[group], ...patch } } }));

  const setHas = (has: boolean) =>
    setGroup({ has, entries: has && g.entries.length === 0 ? [newEntry(uid())] : g.entries } as Partial<typeof g>);

  const setField = (index: number, key: string, value: string) =>
    setGroup({ entries: g.entries.map((e, i) => (i === index ? { ...e, [key]: value } : e)) } as Partial<typeof g>);

  const add = () => setGroup({ entries: [...g.entries, newEntry(uid())] } as Partial<typeof g>);
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
                {(["name", "where"] as const).map((key) => {
                  const name = `${base}.entries.${i}.${key}`;
                  return (
                    <TextField
                      key={key}
                      name={name}
                      label={key === "name" ? f.name[group] : f.where}
                      value={entry[key]}
                      onChange={(v) => setField(i, key, v)}
                      onBlur={() => touch(name)}
                      error={err(name)}
                      placeholder={ph[key][group]}
                      maxLength={200}
                    />
                  );
                })}
                <TextAreaField
                  className="sm:col-span-2"
                  name={`${base}.entries.${i}.details`}
                  label={f.details}
                  optional
                  value={entry.details}
                  onChange={(v) => setField(i, "details", v)}
                  onBlur={() => touch(`${base}.entries.${i}.details`)}
                  error={err(`${base}.entries.${i}.details`)}
                  placeholder={ph.details[group]}
                  maxLength={1000}
                  rows={3}
                />
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
      <div className="space-y-5">
        <SkillsSection />
        <section aria-labelledby="exp-h" className="space-y-5 pt-2">
          <h2 id="exp-h" className="text-center text-[20px] font-bold lg:text-start">
            {t.experience.sectionTitle}
          </h2>
          <p className="flex items-start gap-3 rounded-[12px] border border-line bg-white px-4 py-3 text-[14px] text-ink-muted">
            <Sparkles className="mt-[3px] h-4 w-4 shrink-0 text-orbit-ink" aria-hidden="true" />
            {t.experience.beginners}
          </p>
          {EXPERIENCE_KEYS.map((k) => (
            <Group key={k} group={k} />
          ))}
        </section>
        <MotivationSection />
      </div>
    </div>
  );
}
