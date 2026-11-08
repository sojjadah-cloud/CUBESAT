"use client";

import { Check, Cpu, Megaphone } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { StepHeading } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { teamsFor, type Category } from "@/lib/teams";
import { AlertCircle } from "lucide-react";

export function CategoryStep() {
  const { t, locale } = useLocale();
  const { data, update, err, setNotice } = useWizard();
  const error = err("category");

  const choose = (category: Category) => {
    if (category === data.category) return;
    const hadTeams = Boolean(data.primaryTeam);
    update({ category, primaryTeam: null });
    setNotice(hadTeams ? "changed" : null);
  };

  const cards: { id: Category; icon: typeof Cpu; info: { title: string; desc: string }; accent: string }[] = [
    { id: "technical", icon: Cpu, info: t.category.technical, accent: "text-signal" },
    { id: "non_technical", icon: Megaphone, info: t.category.nonTechnical, accent: "text-orbit-ink" },
  ];

  return (
    <div>
      <StepHeading title={t.category.question} />
      <div role="radiogroup" aria-labelledby="step-heading" id="f-category" tabIndex={-1} className="grid gap-5 md:grid-cols-2">
        {cards.map(({ id, icon: Icon, info, accent }) => {
          const selected = data.category === id;
          const teams = teamsFor(id);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(id)}
              className={`group relative flex h-full flex-col rounded-card border p-6 text-start transition-[border-color,background-color,box-shadow] duration-200 sm:p-7 ${
                selected
                  ? "border-orbit bg-mist shadow-[0_0_0_1px_#FFAA18]"
                  : "border-line bg-white hover:border-[#A9B7C9] hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-[12px] border border-line bg-space-950/60">
                  <Icon className={`h-6 w-6 ${accent}`} aria-hidden="true" />
                </span>
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 place-items-center rounded-full border transition-all duration-200 ${
                    selected ? "scale-100 border-orbit bg-orbit text-navy" : "scale-90 border-line text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              </div>
              <h2 className="mt-5 text-[21px] font-bold">{info.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{info.desc}</p>
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-line/70 pt-4">
                {teams.map((team) => (
                  <span key={team.id} className="rounded-md bg-space-950/50 px-2 py-1 text-[12px] text-ink-muted">
                    {locale === "en" && team.acronym ? team.acronym : team.acronym ? `${team.name[locale]} · ${team.acronym}` : team.name[locale]}
                  </span>
                ))}
              </div>
              {selected && <span className="sr-only">{t.category.selected}</span>}
            </button>
          );
        })}
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
