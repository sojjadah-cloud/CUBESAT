"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CloudOff, Info, Loader2, RotateCcw, Save, X } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { Header } from "@/components/Header";
import { fid } from "@/components/ui/fields";
import { WizardContext, type Limits, type NoticeKey, type WizardContextValue } from "@/components/wizard/context";
import { CategoryStep } from "@/components/wizard/steps/CategoryStep";
import { TeamsStep } from "@/components/wizard/steps/TeamsStep";
import { StudentStep } from "@/components/wizard/steps/StudentStep";
import { ExperienceStep } from "@/components/wizard/steps/ExperienceStep";
import { AttachmentsStep } from "@/components/wizard/steps/AttachmentsStep";
import { ReviewStep } from "@/components/wizard/steps/ReviewStep";
import { SuccessScreen } from "@/components/wizard/SuccessScreen";
import {
  EXPERIENCE_KEYS,
  STEPS,
  emptyApplication,
  validateStep,
  type ApplicationData,
  type StepId,
  type UploadedFile,
} from "@/lib/application";
import type { InstitutionRules } from "@/lib/institution";

type SaveState = "idle" | "saving" | "saved" | "error";
type SubmitError = "duplicate" | "rateLimited" | "submitError" | "network";

const newKey = () => crypto.randomUUID();

/** Merges a stored draft onto a fresh application so older/partial drafts stay valid. */
function restore(raw: unknown): ApplicationData {
  const base = emptyApplication();
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<ApplicationData>;
  const merged = { ...base, ...d, consent: false } as ApplicationData;
  merged.experience = { ...base.experience };
  for (const k of EXPERIENCE_KEYS) {
    const g = d.experience?.[k];
    if (g && Array.isArray(g.entries)) merged.experience[k] = { has: typeof g.has === "boolean" ? g.has : null, entries: g.entries } as never;
  }
  delete (merged as Partial<ApplicationData> & { secondaryTeam?: unknown }).secondaryTeam;
  merged.skills = Array.isArray(d.skills) ? d.skills.filter((s) => typeof s === "string") : [];
  return merged;
}

function Progress({ index, maxIndex, onJump }: { index: number; maxIndex: number; onJump: (i: number) => void }) {
  const { t } = useLocale();
  const pct = ((index + 1) / STEPS.length) * 100;
  return (
    <nav aria-label={t.wizard.progress} className="border-b border-line/70 bg-space-950/60 no-print">
      <div className="container-page py-3">
        {/* Compact (mobile) */}
        <div className="lg:hidden">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-semibold text-ink">{t.steps[STEPS[index]]}</span>
            <span className="text-ink-muted">{t.wizard.stepOf(index + 1, STEPS.length)}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-mist" aria-hidden="true">
            <div className="h-full rounded-full bg-orbit transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {/* Full (desktop) */}
        <ol className="hidden items-center gap-1 lg:flex">
          {STEPS.map((s, i) => {
            const done = i < index || (i <= maxIndex && i !== index);
            const current = i === index;
            const reachable = i <= maxIndex;
            return (
              <li key={s} className="flex flex-1 items-center gap-1 last:flex-none">
                <button
                  type="button"
                  disabled={!reachable || current}
                  onClick={() => onJump(i)}
                  aria-current={current ? "step" : undefined}
                  className={`flex min-h-[40px] items-center gap-2 rounded-lg px-2 text-[13px] transition-colors disabled:cursor-default ${
                    current ? "text-ink" : reachable ? "text-ink-muted hover:text-ink" : "text-ink-faint"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[12px] font-semibold ${
                      current ? "border-orbit bg-orbit text-navy" : done ? "border-signal/70 text-signal" : "border-line"
                    }`}
                  >
                    {done && !current ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : <span dir="ltr">{i + 1}</span>}
                  </span>
                  <span className="whitespace-nowrap font-medium">{t.steps[s]}</span>
                </button>
                {i < STEPS.length - 1 && <span aria-hidden="true" className={`h-px min-w-3 flex-1 ${i < index ? "bg-signal/50" : "bg-line"}`} />}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export function Wizard({ rules, limits }: { rules: InstitutionRules; limits: Limits }) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<ApplicationData>(emptyApplication);
  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [showAll, setShowAll] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<NoticeKey | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const submissionKey = useRef("");
  const interacted = useRef(false);
  const dirty = useRef(false);
  const maxRef = useRef(0);
  const firstRender = useRef(true);
  maxRef.current = maxIndex;

  const step = STEPS[index];
  const errors = useMemo(() => validateStep(step, data, rules), [step, data, rules]);

  /* ───────── Draft load ───────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let startIdx = 0;
      let max = 0;
      try {
        const res = await fetch("/api/draft", { cache: "no-store" });
        const body = await res.json();
        if (!cancelled && body.draft) {
          const d = body.draft as { data?: unknown; step?: string; maxStep?: number; submissionKey?: string };
          setData(restore(d.data));
          setFiles(Array.isArray(body.files) ? body.files : []);
          max = Math.min(Math.max(0, Number(d.maxStep) || 0), STEPS.length - 1);
          startIdx = Math.min(Math.max(0, STEPS.indexOf((d.step === "motivation" ? "experience" : d.step) as StepId)), max);
          if (typeof d.submissionKey === "string") submissionKey.current = d.submissionKey;
          setNotice("restored");
        }
      } catch {
        /* No draft or offline: start fresh. */
      }
      if (cancelled) return;
      const urlStep = STEPS.indexOf(new URLSearchParams(window.location.search).get("step") as StepId);
      if (urlStep >= 0 && urlStep <= max) startIdx = urlStep;
      if (!submissionKey.current) submissionKey.current = newKey();
      setMaxIndex(max);
      setIndex(startIdx);
      window.history.replaceState({ step: startIdx }, "", `?step=${STEPS[startIdx]}`);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ───────── Autosave ───────── */
  const saveNow = useCallback(async () => {
    if (!interacted.current || reference) return;
    setSave("saving");
    try {
      const res = await fetch("/api/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { ...data, consent: false }, step, maxStep: maxRef.current, submissionKey: submissionKey.current }),
      });
      if (!res.ok) throw new Error(String(res.status));
      dirty.current = false;
      setSave("saved");
    } catch {
      setSave("error");
    }
  }, [data, step, reference]);

  useEffect(() => {
    if (!loaded || !interacted.current || reference || submitting) return;
    dirty.current = true;
    const h = setTimeout(saveNow, save === "error" ? 5000 : 1200);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, index, maxIndex, loaded, save === "error"]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* ───────── Navigation ───────── */
  const goToIndex = useCallback((i: number, opts: { push?: boolean; showErrors?: boolean } = {}) => {
    setIndex(i);
    setShowAll(Boolean(opts.showErrors));
    setNotice((n) => (n === "restored" ? n : null));
    if (opts.push !== false) window.history.pushState({ step: i }, "", `?step=${STEPS[i]}`);
  }, []);

  useEffect(() => {
    const onPop = () => {
      const i = STEPS.indexOf(new URLSearchParams(window.location.search).get("step") as StepId);
      setIndex(Math.min(Math.max(0, i), maxRef.current));
      setShowAll(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (!loaded) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.getElementById("step-heading")?.focus({ preventScroll: true });
  }, [index, reference, loaded]);

  const focusFirstError = (keys: string[]) => {
    requestAnimationFrame(() => {
      const el =
        keys.map((k) => document.getElementById(fid(k))).find(Boolean) ??
        document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]');
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    });
  };

  const next = () => {
    const keys = Object.keys(errors);
    if (keys.length) {
      setShowAll(true);
      focusFirstError(keys);
      return;
    }
    const ni = Math.min(index + 1, STEPS.length - 1);
    setMaxIndex((m) => Math.max(m, ni));
    maxRef.current = Math.max(maxRef.current, ni);
    goToIndex(ni);
  };

  const back = () => (index === 0 ? undefined : goToIndex(index - 1));

  const goTo = useCallback((s: StepId) => {
    const i = STEPS.indexOf(s);
    if (i >= 0 && i <= maxRef.current) goToIndex(i);
  }, [goToIndex]);

  /* ───────── State helpers ───────── */
  const update = useCallback<WizardContextValue["update"]>((patch) => {
    interacted.current = true;
    setData((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
    setSubmitError(null);
  }, []);

  const touch = useCallback((key: string) => setTouched((s) => (s.has(key) ? s : new Set(s).add(key))), []);

  const err = useCallback(
    (key: string) => {
      const code = errors[key];
      if (!code || (!showAll && !touched.has(key))) return undefined;
      return t.errors[code];
    },
    [errors, showAll, touched, t],
  );

  const setFilesTracked: typeof setFiles = useCallback((v) => {
    interacted.current = true;
    setFiles(v);
  }, []);

  /* ───────── Submit ───────── */
  const submit = async () => {
    if (submitting) return;
    const keys = Object.keys(errors);
    if (keys.length) {
      setShowAll(true);
      focusFirstError(keys);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, submissionKey: submissionKey.current, locale }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.reference) {
        dirty.current = false;
        setReference(body.reference);
        window.history.replaceState(null, "", "/apply");
        return;
      }
      if (res.status === 422 && body.step) {
        const i = STEPS.indexOf(body.step);
        goToIndex(i >= 0 ? i : 0, { showErrors: true });
        return;
      }
      setSubmitError(res.status === 409 ? "duplicate" : res.status === 429 ? "rateLimited" : "submitError");
    } catch {
      setSubmitError("network");
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = async () => {
    if (!window.confirm(t.wizard.startOverConfirm)) return;
    await fetch("/api/draft", { method: "DELETE" }).catch(() => undefined);
    interacted.current = false;
    dirty.current = false;
    submissionKey.current = newKey();
    setData(emptyApplication());
    setFiles([]);
    setTouched(new Set());
    setMaxIndex(0);
    maxRef.current = 0;
    setSave("idle");
    setNotice(null);
    goToIndex(0);
  };

  const ctx: WizardContextValue = {
    data,
    update,
    err,
    errors,
    touch,
    rules,
    limits,
    files,
    setFiles: setFilesTracked,
    goTo,
    notice,
    setNotice,
  };

  const Prev = locale === "ar" ? ArrowRight : ArrowLeft;
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;
  const errorCount = showAll ? Object.keys(errors).length : 0;

  const submitErrorText =
    submitError === "duplicate" ? t.review.duplicate
    : submitError === "rateLimited" ? t.review.rateLimited
    : submitError === "network" ? t.errors.network
    : submitError ? t.review.submitError : null;

  const saveIndicator =
    save === "saving" ? (
      <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />{t.common.saving}</>
    ) : save === "saved" ? (
      <><Check className="h-3.5 w-3.5 text-signal" aria-hidden="true" />{t.common.saved}</>
    ) : save === "error" ? (
      <><CloudOff className="h-3.5 w-3.5 text-[#B42323]" aria-hidden="true" />{t.common.saveFailed}</>
    ) : null;

  return (
    <WizardContext.Provider value={ctx}>
      <Header />
      {!reference && loaded && <Progress index={index} maxIndex={maxIndex} onJump={(i) => goToIndex(i)} />}

      <main id="main" className="relative">
        <div aria-hidden="true" className="starfield pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-40" />
        <div className="container-page relative max-w-[920px] pb-36 pt-8 sm:pt-12">
          {!loaded ? (
            <div className="flex items-center gap-3 py-24 text-ink-muted" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </div>
          ) : reference ? (
            <SuccessScreen reference={reference} />
          ) : (
            <>
              {notice && (
                <div className="mb-6 flex items-start justify-between gap-3 rounded-[12px] border border-line bg-white px-4 py-3 text-[14px]" role="status">
                  <span className="flex items-start gap-2.5">
                    <Info className="mt-[3px] h-4 w-4 shrink-0 text-signal" aria-hidden="true" />
                    {notice === "restored" ? t.wizard.draftRestored : t.category.changed}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {notice === "restored" && (
                      <button type="button" onClick={startOver} className="btn-ghost btn-sm text-[13px]">
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.common.startOver}
                      </button>
                    )}
                    <button type="button" onClick={() => setNotice(null)} className="grid h-9 w-9 place-items-center rounded-md text-ink-muted hover:bg-space-900 hover:text-ink" aria-label={t.common.close}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                </div>
              )}

              {errorCount > 0 && step !== "review" && (
                <div className="mb-6 flex items-center gap-2.5 rounded-[12px] border border-aero/50 bg-aero/10 px-4 py-3 text-[14px]" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#B42323]" aria-hidden="true" />
                  {t.wizard.errorSummary}
                </div>
              )}

              <div key={step} className="animate-fade-up">
                {step === "category" && <CategoryStep />}
                {step === "teams" && <TeamsStep />}
                {step === "student" && <StudentStep />}
                {step === "experience" && <ExperienceStep />}
                {step === "attachments" && <AttachmentsStep />}
                {step === "review" && <ReviewStep submitting={submitting} submitError={submitErrorText} onSubmit={submit} />}
              </div>
            </>
          )}
        </div>
      </main>

      {loaded && !reference && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-space-950/92 backdrop-blur-md no-print">
          <div className="container-page flex max-w-[920px] items-center justify-between gap-3 py-3">
            {index === 0 ? (
              <span className="min-w-[44px]" aria-hidden="true" />
            ) : (
              <button type="button" onClick={back} className="btn-secondary">
                <Prev className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.common.back}</span>
              </button>
            )}

            <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:justify-center">
              <span className="hidden items-center gap-1.5 truncate text-[12px] text-ink-muted sm:flex" aria-live="polite">
                {saveIndicator}
              </span>
              <button
                type="button"
                onClick={() => {
                  interacted.current = true;
                  void saveNow();
                }}
                className="btn-ghost btn-sm"
                disabled={save === "saving"}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span className="sm:hidden">{save === "saved" ? t.common.saved : t.common.saveDraft}</span>
                <span className="hidden sm:inline">{t.common.saveDraft}</span>
              </button>
            </div>

            {step !== "review" ? (
              <button type="button" onClick={next} className="btn-primary min-w-[120px]">
                {t.common.continue}
                <Next className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <span className="hidden min-w-[120px] sm:block" aria-hidden="true" />
            )}
          </div>
        </div>
      )}
    </WizardContext.Provider>
  );
}
