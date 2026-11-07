"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
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

export function Header({ variant = "site" }: { variant?: "site" | "apply" }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/about", label: t.nav.about },
    { href: "/teams", label: t.nav.teams },
    { href: "/how-to-apply", label: t.nav.process },
  ];
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-space-950/90 backdrop-blur-md no-print">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-orbit focus:px-3 focus:py-2 focus:text-navy">
        {t.common.skipToContent}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 rounded-lg">
          <LogoMark />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-bold tracking-tight text-ink">{t.common.appName}</span>
            <span className="hidden text-[12px] text-ink-muted sm:block">{t.common.tagline}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {variant === "site" && (
            <nav aria-label={t.nav.menu} className="hidden items-center gap-1 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`btn-ghost btn-sm ${isActive(l.href) ? "text-ink" : ""}`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
          <LanguageSwitcher />
          {variant === "site" && (
            <>
              <Link href="/apply" className="btn-primary btn-sm hidden sm:inline-flex">
                {t.nav.apply}
              </Link>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? t.common.close : t.nav.menu}
                className="btn-ghost btn-sm border border-line lg:hidden"
              >
                {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
              </button>
            </>
          )}
        </div>
      </div>

      {variant === "site" && open && (
        <nav id="mobile-nav" aria-label={t.nav.menu} className="border-t border-line/70 lg:hidden">
          <ul className="container-page py-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-3 text-[15px] ${isActive(l.href) ? "bg-mist text-ink" : "text-ink-muted"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <Link href="/apply" className="btn-primary w-full">
                {t.nav.apply}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
