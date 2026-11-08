"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { StepHeading } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { skillById, teamTag, teamsFor, type Team } from "@/lib/teams";

function TeamCard({ team }: { team: Team }) {
  const { t, locale } = useLocale();
  const { data, update, appliedTeams } = useWizard();
  const [open, setOpen] = useState(false);
  const selected = data.primaryTeam === team.id;
  const applied = appliedTeams.includes(team.id);
  const detailsId = `team-${team.id}-details`;

  return (
    <article
      className={`flex flex-col rounded-card border bg-white p-5 transition-[border-color,box-shadow] duration-200 sm:p-6 ${
        selected ? "border-orbit shadow-[0_0_0_1px_#FFAA18]" : "border-line hover:border-[#A9B7C9]"
      }`}
      aria-labelledby={`team-${team.id}-name`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={`team-${team.id}-name`} className="text-[17px] font-bold leading-snug">
          {team.name[locale]}
        </h2>
        <div className="flex shrink-0 items-center gap-1.5">
          {teamTag(team, locale) && <span className="badge border border-line text-ink-muted" dir="ltr">{teamTag(team, locale)}</span>}
          {selected && <span className="badge bg-orbit text-navy">{t.teams.selectedBadge}</span>}
        </div>
      </div>

      <p className="mt-3 text-[14px] text-ink-muted">{team.description[locale]}</p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={detailsId}
        className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 self-start rounded-md text-[13px] font-semibold text-signal hover:text-ink"
      >
        {open ? t.teams.hideDetails : t.teams.details}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <div id={detailsId} hidden={!open} className="mt-2 space-y-4 border-t border-line pt-4 text-[14px]">
        {[
          { title: t.teams.responsibilities, items: team.responsibilities[locale] },
          { title: t.teams.activities, items: team.activities[locale] },
        ].map((block) => (
          <div key={block.title}>
            <h3 className="text-[13px] font-semibold text-ink">{block.title}</h3>
            <ul className="mt-1.5 space-y-1 text-ink-muted">
              {block.items.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-orbit" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-[13px] font-semibold text-ink">{t.teams.skills}</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {team.skills.map((id) => (
              <li key={id} className="rounded-md border border-line px-2 py-0.5 text-[12px] text-ink-muted">
                {skillById(id)?.label[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          disabled={applied}
          onClick={() => update({ primaryTeam: team.id })}
          className={`btn btn-sm w-full ${selected ? "bg-orbit text-navy" : "border border-line bg-white text-ink hover:border-orbit"}`}
        >
          {(selected || applied) && <Check className="h-4 w-4" aria-hidden="true" />}
          {applied ? t.teams.applied : selected ? t.teams.selectedBadge : t.teams.choose}
        </button>
      </div>
    </article>
  );
}

export function TeamsStep() {
  const { t } = useLocale();
  const { data, err } = useWizard();
  if (!data.category) return null;
  const teams = teamsFor(data.category);
  const error = err("primaryTeam");

  return (
    <div>
      <StepHeading title={t.teams.title} />

      <div role="radiogroup" aria-labelledby="step-heading" id="f-primaryTeam" tabIndex={-1} className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
      {error && (
        <p className="field-error mt-4" role="alert">
          <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
