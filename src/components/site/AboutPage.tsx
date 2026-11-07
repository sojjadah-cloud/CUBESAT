"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { ApplyCta, PageHeader, SiteShell, useDirArrows } from "@/components/site/SiteShell";
import { teamsFor, type Category } from "@/lib/teams";

export function AboutPage() {
  const { t } = useLocale();
  const { Forward } = useDirArrows();

  return (
    <SiteShell>
      <PageHeader eyebrow={t.nav.about} title={t.common.projectName} lead={t.landing.lead} />

      <section className="py-14 sm:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-[24px] font-bold sm:text-[28px]">{t.landing.objectivesTitle}</h2>
            <p className="mt-4 text-ink-muted">{t.landing.lead2}</p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
            {t.landing.objectives.map((o, i) => (
              <li key={o.title} className="bg-white p-6">
                <span className="font-display text-[13px] font-semibold text-orbit-ink">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[17px] font-semibold">{o.title}</h3>
                <p className="mt-2 text-[14px] text-ink-muted">{o.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line/60 py-14 sm:py-16">
        <div className="container-page">
          <h2 className="text-[24px] font-bold sm:text-[28px]">{t.landing.opportunitiesTitle}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{t.landing.opportunitiesLead}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {(["technical", "non_technical"] as Category[]).map((cat) => {
              const info = cat === "technical" ? t.landing.technical : t.landing.nonTechnical;
              return (
                <Link key={cat} href={`/teams#${cat}`} className="group rounded-card border border-line bg-white p-6 transition-colors hover:border-orbit/60">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[19px] font-bold">{info.title}</h3>
                    <span className="text-[13px] text-ink-faint">{t.category.subteams(teamsFor(cat).length)}</span>
                  </div>
                  <p className="mt-3 text-[14px] text-ink-muted">{info.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold group-hover:text-orbit-ink">
                    {t.landing.ctaSecondary}
                    <Forward className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-10">
            <ApplyCta />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
