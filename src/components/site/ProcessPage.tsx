"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { ApplyCta, PageHeader, SiteShell } from "@/components/site/SiteShell";

export function ProcessPage() {
  const { t } = useLocale();
  return (
    <SiteShell>
      <PageHeader eyebrow={t.nav.process} title={t.landing.processTitle} lead={t.landing.processLead} />
      <section className="py-14 sm:py-16">
        <div className="container-page">
          <ol className="grid gap-8 md:grid-cols-3">
            {t.landing.process.map((p, i) => (
              <li key={p.title} className="relative border-t-2 border-line pt-5">
                <span aria-hidden="true" className="absolute -top-[5px] start-0 h-2 w-2 rounded-full bg-orbit" />
                <span className="font-display text-[13px] font-semibold text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-2 text-[18px] font-semibold">{p.title}</h2>
                <p className="mt-2 text-[14px] text-ink-muted">{p.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-card border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex gap-4">
              <Sparkles className="mt-1 h-5 w-5 shrink-0 text-orbit-ink" aria-hidden="true" />
              <div>
                <h2 className="text-[18px] font-semibold">{t.landing.beginnersTitle}</h2>
                <p className="mt-1.5 max-w-[62ch] text-[14px] text-ink-muted">{t.landing.beginnersBody}</p>
              </div>
            </div>
            <ApplyCta />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
