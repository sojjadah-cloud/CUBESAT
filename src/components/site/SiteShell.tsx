"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { Header } from "@/components/Header";

/** Public pages run in one direction: home → about → teams → application. */
export const SITE_FLOW = ["/", "/about", "/teams", "/apply"] as const;

export function SiteShell({ step, children }: { step: number; children: React.ReactNode }) {
  const { t } = useLocale();
  const total = SITE_FLOW.length - 1;
  return (
    <>
      <Header />
      <div className="h-1 bg-mist no-print" aria-hidden="true">
        <div className="h-full bg-orbit transition-[width] duration-300" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <main id="main">{children}</main>
      <footer className="border-t border-line/70 py-6">
        <div className="container-page text-[13px] text-ink-muted">{t.landing.footer}</div>
      </footer>
    </>
  );
}

export function PageTitle({ title }: { title: string }) {
  return (
    <div className="container-page pt-12 sm:pt-16">
      <h1 className="text-[30px] font-bold leading-tight sm:text-[38px]">{title}</h1>
    </div>
  );
}

/** The single forward action at the end of each public page. */
export function NextButton({ step, label }: { step: number; label?: string }) {
  const { t, locale } = useLocale();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  return (
    <div className="container-page flex justify-end py-10 sm:py-12">
      <Link href={SITE_FLOW[step + 1]} className="btn-primary min-h-[52px] px-8 text-[16px]">
        {label ?? t.common.next}
        <Arrow className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
