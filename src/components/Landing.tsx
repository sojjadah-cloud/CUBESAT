"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { OrbitGlobe } from "@/components/OrbitGlobe";
import { SiteShell } from "@/components/site/SiteShell";

export function Landing() {
  const { t, locale } = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <SiteShell step={0}>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="starfield absolute inset-0 opacity-60" />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:gap-14 lg:py-24">
          <div className="animate-fade-up text-center lg:text-start">
            <h1 className="text-[34px] font-bold leading-[1.15] sm:text-[46px] lg:text-[54px]">{t.landing.title}</h1>
            <p className="mt-4 font-display text-[20px] font-semibold text-orbit-ink sm:text-[22px]">{t.common.tagline}</p>
            <p className="mx-auto mt-6 max-w-[60ch] text-ink-muted lg:mx-0">{t.landing.lead}</p>
            <Link href="/about" className="btn-primary mt-8 min-h-[52px] w-full max-w-[320px] px-8 text-[16px] lg:w-auto">
              {t.common.start}
              <Arrow className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[480px] rounded-[18px] border border-[#1B3156] bg-[#0B1B33] p-3 shadow-[0_24px_48px_-24px_rgba(11,27,51,0.45)] sm:p-5">
            <OrbitGlobe className="h-auto w-full" title={t.landing.illustration.title} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
