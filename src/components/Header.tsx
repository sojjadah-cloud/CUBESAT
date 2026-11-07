"use client";

import Link from "next/link";
import { Languages } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { LogoMark } from "@/components/Brand";

export function LanguageSwitcher() {
  const { locale, t, setLocale } = useLocale();
  const next = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="btn-ghost btn-sm border border-line"
      aria-label={t.common.switchToLabel}
      lang={next}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{t.common.switchTo}</span>
    </button>
  );
}

export function Header() {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-space-950/90 backdrop-blur-md no-print">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-orbit focus:px-3 focus:py-2 focus:text-navy">
        {t.common.skipToContent}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 rounded-lg">
          <LogoMark />
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">{t.common.appName}</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
