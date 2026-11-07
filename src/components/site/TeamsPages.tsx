"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { ApplyCta, PageHeader, SiteShell, useDirArrows } from "@/components/site/SiteShell";
import { skillById, teamById, teamsFor, type Category } from "@/lib/teams";

export function TeamsIndexPage() {
  const { t, locale } = useLocale();
  const { Forward } = useDirArrows();

  return (
    <SiteShell>
      <PageHeader eyebrow={t.nav.teams} title={t.landing.teamsTitle} lead={t.landing.teamsPageLead} />
      {(["technical", "non_technical"] as Category[]).map((cat) => {
        const info = cat === "technical" ? t.landing.technical : t.landing.nonTechnical;
        return (
          <section key={cat} id={cat} className="scroll-mt-20 border-b border-line/60 py-12 sm:py-14" aria-labelledby={`${cat}-h`}>
            <div className="container-page">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id={`${cat}-h`} className="text-[22px] font-bold sm:text-[26px]">
                  {info.title}
                </h2>
                <span className="text-[13px] text-ink-faint">{info.count}</span>
              </div>
              <p className="mt-2 max-w-2xl text-ink-muted">{info.body}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teamsFor(cat).map((team) => (
                  <li key={team.id}>
                    <Link href={`/teams/${team.id}`} className="group flex h-full flex-col rounded-card border border-line bg-white p-5 transition-colors hover:border-orbit/60">
                      <h3 className="text-[16px] font-semibold">{team.name[locale]}</h3>
                      <p className="mt-2 flex-1 text-[14px] text-ink-muted">{team.description[locale]}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold group-hover:text-orbit-ink">
                        {t.landing.viewTeam}
                        <Forward className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
      <div className="container-page py-12">
        <ApplyCta />
      </div>
    </SiteShell>
  );
}

export function TeamDetailPage({ id }: { id: string }) {
  const { t, locale } = useLocale();
  const { Back } = useDirArrows();
  const team = teamById(id)!;
  const area = team.category === "technical" ? t.landing.technical.title : t.landing.nonTechnical.title;
  const others = teamsFor(team.category).filter((x) => x.id !== team.id);

  const List = ({ title, items }: { title: string; items: string[] }) => (
    <section className="rounded-card border border-line bg-white p-6">
      <h2 className="text-[16px] font-bold">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[15px] text-ink-muted">
        {items.map((r) => (
          <li key={r} className="flex gap-3">
            <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-orbit" />
            {r}
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <SiteShell>
      <div className="container-page pt-6">
        <Link href="/teams" className="btn-ghost btn-sm -ms-3">
          <Back className="h-4 w-4" aria-hidden="true" />
          {t.landing.backToTeams}
        </Link>
      </div>
      <section className="border-b border-line/60">
        <div className="container-page pb-12 pt-4 sm:pb-14">
          <p className="eyebrow">{area}</p>
          <h1 className="mt-3 text-[30px] font-bold leading-tight sm:text-[40px]">
            {team.name[locale]}
            {locale === "en" && team.acronym && <span className="ms-3 align-middle text-[18px] font-semibold text-ink-faint">{team.acronym}</span>}
          </h1>
          <p className="mt-4 max-w-[64ch] text-[17px] text-ink-muted">{team.description[locale]}</p>
          <div className="mt-8">
            <ApplyCta />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="container-page grid gap-4 md:grid-cols-2">
          <List title={t.teams.responsibilities} items={team.responsibilities[locale]} />
          <List title={t.teams.activities} items={team.activities[locale]} />
          <section className="rounded-card border border-line bg-white p-6 md:col-span-2">
            <h2 className="text-[16px] font-bold">{t.teams.skills}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {team.skills.map((s) => (
                <li key={s} className="rounded-full border border-line px-3.5 py-1.5 text-[14px] text-ink-muted">
                  {skillById(s)?.label[locale]}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="border-t border-line/60 py-12" aria-labelledby="others-h">
        <div className="container-page">
          <h2 id="others-h" className="text-[18px] font-bold">{t.landing.otherTeams}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={`/teams/${o.id}`} className="chip">
                  {o.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
