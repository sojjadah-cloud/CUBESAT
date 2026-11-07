"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Printer } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export function SuccessScreen({ reference }: { reference: string }) {
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
        <p className="mt-3 text-[12px] text-ink-faint">{s.keep}</p>
      </div>

      <div className="no-print mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          {s.home}
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-secondary">
          <Printer className="h-4 w-4" aria-hidden="true" />
          {s.print}
        </button>
      </div>
    </div>
  );
}
