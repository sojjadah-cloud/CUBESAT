"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Cpu, Megaphone, Printer } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import type { Category } from "@/lib/teams";

export function SuccessScreen({ reference, onAnother }: { reference: string; onAnother: (c: Category) => void }) {
  const { t } = useLocale();
  const s = t.success;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the reference stays visible to copy manually */
    }
  };

  return (
    <div className="mx-auto max-w-[640px] animate-fade-up py-6 text-center sm:py-12">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-orbit/50 bg-orbit/10">
        <Check className="h-8 w-8 text-orbit-ink" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <h1 id="step-heading" tabIndex={-1} className="mt-6 text-[26px] font-bold outline-none sm:text-[32px]">
        {s.title}
      </h1>
      <p className="mx-auto mt-4 max-w-[52ch] text-ink-muted">{s.body}</p>

      <div className="mx-auto mt-8 max-w-[440px] rounded-card border border-line bg-white p-5">
        <p className="text-[13px] text-ink-muted">{s.reference}</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="font-display text-[22px] font-bold tracking-wider text-ink" dir="ltr">
            {reference}
          </span>
          <button type="button" onClick={copy} className="btn-ghost btn-sm no-print" aria-label={`${s.copy} ${reference}`}>
            {copied ? <Check className="h-4 w-4 text-signal" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            <span aria-live="polite">{copied ? s.copied : s.copy}</span>
          </button>
        </div>
      </div>

      <section className="no-print mx-auto mt-8 max-w-[520px] rounded-card border border-orbit/50 bg-orbit/[0.07] p-5 sm:p-6" aria-labelledby="another-h">
        <h2 id="another-h" className="text-[18px] font-bold">
          {s.another}
        </h2>
        <p className="mt-1.5 text-[14px] text-ink-muted">{s.anotherHint}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => onAnother("technical")} className="btn-primary">
            <Cpu className="h-4 w-4" aria-hidden="true" />
            {t.category.technical.title}
          </button>
          <button type="button" onClick={() => onAnother("non_technical")} className="btn-primary">
            <Megaphone className="h-4 w-4" aria-hidden="true" />
            {t.category.nonTechnical.title}
          </button>
        </div>
      </section>

      <div className="no-print mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-secondary">
          {s.noThanks}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-ghost">
          <Printer className="h-4 w-4" aria-hidden="true" />
          {s.print}
        </button>
      </div>
    </div>
  );
}
