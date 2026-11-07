"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { Header } from "@/components/Header";

/** Public pages run in one direction: three introduction pages, then the application form. */
export const SITE_FLOW = ["/", "/about", "/teams", "/apply"] as const;
const INTRO_PAGES = SITE_FLOW.length - 1;

function IntroIndicator({ step }: { step: number }) {
  const { t } = useLocale();
  return (
    <div className="border-b border-line/60 bg-white/60 no-print">
      <div className="container-page flex items-center justify-center gap-3 py-3 lg:justify-start">
        <ol className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: INTRO_PAGES }, (_, i) => (
            <li key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-orbit" : "bg-mist"}`} />
          ))}
        </ol>
        <p className="text-[13px] font-medium text-ink-muted">{t.common.introStep(step + 1, INTRO_PAGES)}</p>
      </div>
    </div>
  );
}

export function SiteShell({ step, children }: { step: number; children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <>
      <Header />
      <IntroIndicator step={step} />
      <main id="main">{children}</main>
      <footer className="border-t border-line/70 py-6">
        <div className="container-page text-center text-[13px] text-ink-muted lg:text-start">{t.landing.footer}</div>
      </footer>
    </>
  );
}

export function PageTitle({ title }: { title: string }) {
  return (
    <div className="container-page pt-10 text-center sm:pt-14 lg:text-start">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">{title}</h1>
    </div>
  );
}

/** The single forward action at the end of each public page. */
export function NextButton({ step, label }: { step: number; label?: string }) {
  const { t, locale } = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const last = step === INTRO_PAGES - 1;
  return (
    <div className="container-page flex flex-col items-center gap-3 py-10 sm:py-12 lg:items-end">
      {last && <p className="text-[14px] font-medium text-ink-muted">{t.common.formNext}</p>}
      <Link href={SITE_FLOW[step + 1]} className="btn-primary min-h-[52px] w-full max-w-[320px] px-8 text-[16px] lg:w-auto">
        {label ?? t.common.next}
        <Arrow className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
