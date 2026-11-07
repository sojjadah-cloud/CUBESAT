"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { CubeSatIllustration } from "@/components/Brand";
import { SiteShell, useDirArrows } from "@/components/site/SiteShell";

function Corner({ className }: { className: string }) {
  return <span aria-hidden="true" className={`pointer-events-none absolute h-3 w-3 border-orbit/70 ${className}`} />;
}

export function Landing() {
  const { t } = useLocale();
  const { Forward } = useDirArrows();

  const cards = [
    { href: "/about", title: t.nav.about, body: t.landing.cards.about, n: "01" },
    { href: "/teams", title: t.nav.teams, body: t.landing.cards.teams, n: "02" },
    { href: "/how-to-apply", title: t.nav.process, body: t.landing.cards.process, n: "03" },
  ];

  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-line/60">
        <div aria-hidden="true" className="starfield absolute inset-0 opacity-60" />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:gap-14 lg:py-24">
          <div className="animate-fade-up">
            <p className="eyebrow">{t.landing.eyebrow}</p>
            <h1 className="mt-4 text-[34px] font-bold leading-[1.15] sm:text-[46px] lg:text-[54px]">{t.landing.title}</h1>
            <p className="mt-4 font-display text-[20px] font-semibold text-orbit-ink sm:text-[22px]">{t.common.tagline}</p>
            <p className="mt-6 max-w-[60ch] text-ink-muted">{t.landing.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/apply" className="btn-primary min-h-[50px] px-6 text-[16px]">
                {t.landing.cta}
                <Forward className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/teams" className="btn-secondary min-h-[50px] px-6">
                {t.landing.ctaSecondary}
              </Link>
            </div>
            <p className="mt-8 flex items-start gap-2.5 text-[13px] text-ink-muted">
              <span aria-hidden="true" className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-orbit" />
              {t.landing.status}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="relative rounded-[18px] border border-[#1B3156] bg-[#0B1B33] p-3 shadow-[0_24px_48px_-24px_rgba(11,27,51,0.45)] sm:p-5">
              <div aria-hidden="true" className="grid-lines absolute inset-0 rounded-[18px]" />
              <Corner className="start-3 top-3 border-s border-t" />
              <Corner className="end-3 top-3 border-e border-t" />
              <Corner className="bottom-3 start-3 border-b border-s" />
              <Corner className="bottom-3 end-3 border-b border-e" />
              <CubeSatIllustration className="relative h-auto w-full" labels={t.landing.illustration} />
              <dl className="relative mt-2 flex items-center justify-between border-t border-[#294365] px-1 pt-3 text-[12px]">
                <dt className="text-[#7F95B2]">{t.landing.specLabel}</dt>
                <dd className="font-medium text-[#AFC2D8]">{t.landing.specValue}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16" aria-labelledby="explore-h">
        <div className="container-page">
          <h2 id="explore-h" className="text-[22px] font-bold sm:text-[26px]">
            {t.landing.explore}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {cards.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="group flex h-full flex-col rounded-card border border-line bg-white p-6 transition-colors hover:border-orbit/60">
                  <span className="font-display text-[13px] font-semibold text-orbit-ink">{c.n}</span>
                  <h3 className="mt-3 text-[18px] font-semibold">{c.title}</h3>
                  <p className="mt-2 flex-1 text-[14px] text-ink-muted">{c.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink group-hover:text-orbit-ink">
                    {t.common.learnMore}
                    <Forward className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
