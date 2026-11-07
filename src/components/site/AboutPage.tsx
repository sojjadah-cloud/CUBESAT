"use client";

import { useLocale } from "@/components/LocaleProvider";
import { NextButton, PageTitle, SiteShell } from "@/components/site/SiteShell";

export function AboutPage() {
  const { t } = useLocale();

  return (
    <SiteShell step={1}>
      <PageTitle title={t.nav.about} />
      <section className="container-page pt-6">
        <p className="max-w-[68ch] text-ink-muted">{t.landing.lead2}</p>
        <h2 className="mt-10 text-[20px] font-bold">{t.landing.objectivesTitle}</h2>
        <ol className="mt-4 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
          {t.landing.objectives.map((o, i) => (
            <li key={o.title} className="bg-white p-6">
              <span className="font-display text-[13px] font-semibold text-orbit-ink">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-[17px] font-semibold">{o.title}</h3>
              <p className="mt-1.5 text-[14px] text-ink-muted">{o.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <NextButton step={1} />
    </SiteShell>
  );
}
