"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { Header } from "@/components/Header";
import { LogoMark } from "@/components/Brand";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <footer className="border-t border-line/70 py-8">
        <div className="container-page flex flex-col items-start justify-between gap-4 text-[13px] text-ink-muted sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7" />
            <span>{t.landing.footer}</span>
          </div>
          <Link href="/admin" className="hover:text-ink">
            {t.landing.adminLink}
          </Link>
        </div>
      </footer>
    </>
  );
}

/** Title block shared by the inner pages. */
export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <section className="border-b border-line/60">
      <div className="container-page py-12 sm:py-16">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-[30px] font-bold leading-tight sm:text-[40px]">{title}</h1>
        {lead && <p className="mt-4 max-w-[64ch] text-ink-muted">{lead}</p>}
      </div>
    </section>
  );
}

export function useDirArrows() {
  const { locale } = useLocale();
  return { Forward: locale === "ar" ? ArrowLeft : ArrowRight, Back: locale === "ar" ? ArrowRight : ArrowLeft };
}

export function ApplyCta() {
  const { t } = useLocale();
  const { Forward } = useDirArrows();
  return (
    <Link href="/apply" className="btn-primary">
      {t.landing.cta}
      <Forward className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
