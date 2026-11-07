"use client";

import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { StepHeading } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import { ApplicationSummary } from "@/components/ApplicationSummary";

export function ReviewStep({ submitting, submitError, onSubmit }: { submitting: boolean; submitError: string | null; onSubmit: () => void }) {
  const { t, locale } = useLocale();
  const { data, files, update, err, goTo } = useWizard();
  const r = t.review;
  const consentError = err("consent");

  return (
    <div>
      <StepHeading eyebrow={t.steps.review} title={r.title} lead={r.lead} />
      <ApplicationSummary data={data} files={files} t={t} locale={locale} onEdit={goTo} />

      <section className="mt-6 rounded-card border border-line bg-space-900 p-5 sm:p-7" aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="flex items-center gap-2 text-[16px] font-bold">
          <ShieldCheck className="h-5 w-5 text-signal" aria-hidden="true" />
          {r.privacyTitle}
        </h2>
        <p className="mt-2 text-[14px] text-ink-muted">{r.privacy}</p>

        <label
          htmlFor="f-consent"
          className={`mt-5 flex cursor-pointer gap-3 rounded-[12px] border p-4 transition-colors ${
            data.consent ? "border-signal bg-signal/10" : consentError ? "border-aero/70" : "border-line hover:border-[#A9B7C9]"
          }`}
        >
          <input
            id="f-consent"
            type="checkbox"
            checked={data.consent}
            onChange={(e) => update({ consent: e.target.checked })}
            className="mt-1 h-5 w-5 shrink-0 accent-[#1F3556]"
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? "f-consent-error" : undefined}
          />
          <span className="text-[14px] leading-relaxed text-ink">{r.consent}</span>
        </label>
        {consentError && (
          <p id="f-consent-error" className="field-error" role="alert">
            <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {consentError}
          </p>
        )}

        {submitError && (
          <div role="alert" className="mt-5 flex gap-3 rounded-[12px] border border-aero/60 bg-aero/10 p-4 text-[14px] text-ink">
            <AlertCircle className="mt-[2px] h-4 w-4 shrink-0 text-[#B42323]" aria-hidden="true" />
            {submitError}
          </div>
        )}

        <button type="button" onClick={onSubmit} disabled={submitting} aria-busy={submitting} className="btn-primary mt-6 w-full min-h-[52px] text-[16px] sm:w-auto sm:px-8">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? r.submitting : r.submit}
        </button>
      </section>
    </div>
  );
}
