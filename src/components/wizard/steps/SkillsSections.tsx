"use client";

import { Check } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { ChoiceGroup, TextAreaField, TextField } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { SKILLS, teamById, type Skill } from "@/lib/teams";
import { WEEKLY_HOURS } from "@/lib/institution";

/** Skills section of the "Skills & experience" step. */
export function SkillsSection() {
  const { t, locale } = useLocale();
  const { data, update, err, touch } = useWizard();
  const m = t.motivation;

  const suggestedIds = teamById(data.primaryTeam)?.skills ?? [];
  const suggested = suggestedIds.map((id) => SKILLS.find((s) => s.id === id)).filter(Boolean) as Skill[];
  const rest = SKILLS.filter((s) => s.category === data.category && !suggestedIds.includes(s.id));

  const toggle = (id: string) =>
    update((d) => ({ skills: d.skills.includes(id) ? d.skills.filter((s) => s !== id) : [...d.skills, id] }));

  const chips = (list: Skill[]) => (
    <ul className="flex flex-wrap gap-2">
      {list.map((s) => {
        const on = data.skills.includes(s.id);
        return (
          <li key={s.id}>
            <button type="button" className="chip" aria-pressed={on} onClick={() => toggle(s.id)}>
              {on && <Check className="h-3.5 w-3.5 text-signal" aria-hidden="true" />}
              <span dir="auto">{s.label[locale]}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
      <section className="panel p-5 sm:p-7" aria-labelledby="skills-q">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="skills-q" className="text-[18px] font-bold">
            {m.skillsQuestion}
          </h2>
          <span className="text-[13px] text-ink-faint" aria-live="polite">
            {m.selectedCount(data.skills.length)}
          </span>
        </div>
        <p className="mt-1 text-[14px] text-ink-muted">{m.skillsHint}</p>

        {suggested.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2.5 text-[13px] font-semibold text-orbit-ink">{m.suggested}</h3>
            {chips(suggested)}
          </div>
        )}
        {rest.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2.5 text-[13px] font-semibold text-ink-muted">{m.moreSkills}</h3>
            {chips(rest)}
          </div>
        )}
        <TextField
          className="mt-6"
          name="skillsOther"
          label={m.skillsOther}
          hint={m.skillsOtherHint}
          optional
          value={data.skillsOther}
          onChange={(v) => update({ skillsOther: v })}
          onBlur={() => touch("skillsOther")}
          error={err("skillsOther")}
          placeholder={m.ph.skillsOther}
          maxLength={300}
        />
      </section>
  );
}

/** Motivation section of the "Skills & experience" step. */
export function MotivationSection() {
  const { t, locale } = useLocale();
  const { data, update, err, touch } = useWizard();
  const m = t.motivation;

  return (
      <section className="panel space-y-6 p-5 sm:p-7" aria-labelledby="motivation-h">
        <h2 id="motivation-h" className="text-[18px] font-bold">
          {m.motivationTitle}
        </h2>
        <TextAreaField
          name="motivationWhy"
          label={m.why}
          value={data.motivationWhy}
          onChange={(v) => update({ motivationWhy: v })}
          onBlur={() => touch("motivationWhy")}
          error={err("motivationWhy")}
          placeholder={m.ph.why}
          maxLength={1500}
        />
        <TextAreaField
          name="motivationContribute"
          label={m.contribute}
          value={data.motivationContribute}
          onChange={(v) => update({ motivationContribute: v })}
          onBlur={() => touch("motivationContribute")}
          error={err("motivationContribute")}
          placeholder={m.ph.contribute}
          maxLength={1500}
          rows={3}
        />
        <TextAreaField
          name="motivationLearn"
          label={m.learn}
          value={data.motivationLearn}
          onChange={(v) => update({ motivationLearn: v })}
          onBlur={() => touch("motivationLearn")}
          error={err("motivationLearn")}
          placeholder={m.ph.learn}
          maxLength={1500}
          rows={3}
        />
        <ChoiceGroup
          name="weeklyHours"
          legend={m.hours}
          value={data.weeklyHours}
          onChange={(v) => update({ weeklyHours: v })}
          options={WEEKLY_HOURS.map((h) => ({ value: h.id, label: h[locale] }))}
          error={err("weeklyHours")}
          columns={4}
        />
      </section>
  );
}
