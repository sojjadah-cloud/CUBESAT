"use client";

import { useLocale } from "@/components/LocaleProvider";
import { NextButton, PageTitle, SiteShell } from "@/components/site/SiteShell";
import { teamsFor, type Category } from "@/lib/teams";

export function TeamsIndexPage() {
  const { t, locale } = useLocale();

  return (
    <SiteShell step={2}>
      <PageTitle title={t.nav.teams} />
      {(["technical", "non_technical"] as Category[]).map((cat) => {
        const info = cat === "technical" ? t.landing.technical : t.landing.nonTechnical;
        return (
          <section key={cat} className="container-page pt-8 text-center lg:text-start" aria-labelledby={`${cat}-h`}>
            <h2 id={`${cat}-h`} className="text-[20px] font-bold">
              {info.title}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamsFor(cat).map((team) => (
                <li key={team.id} className="rounded-card border border-line bg-white p-5">
                  <h3 className="text-[16px] font-semibold">{team.name[locale]}</h3>
                  <p className="mt-1.5 text-[14px] text-ink-muted">{team.description[locale]}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <NextButton step={2} label={t.landing.cta} />
    </SiteShell>
  );
}
