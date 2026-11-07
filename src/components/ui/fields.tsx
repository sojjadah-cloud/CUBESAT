"use client";

import { AlertCircle } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

export const fid = (key: string) => `f-${key.replace(/\./g, "-")}`;

interface BaseProps {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
}

export function FieldShell({
  name,
  label,
  hint,
  error,
  optional,
  className = "",
  children,
  counter,
}: BaseProps & { children: React.ReactNode; counter?: string }) {
  const { t } = useLocale();
  const id = fid(name);
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="field-label">
          {label}
          {optional && <span className="ms-2 text-[12px] font-normal text-ink-faint">({t.common.optional})</span>}
        </label>
        {counter && (
          <span className="text-[12px] text-ink-faint" dir="ltr" aria-hidden="true">
            {counter}
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export const describedBy = (name: string, hint?: string, error?: string) => {
  const id = fid(name);
  return [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
};

export function TextField({
  value,
  onChange,
  onBlur,
  type = "text",
  inputMode,
  autoComplete,
  ltr,
  maxLength,
  placeholder,
  ...base
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  ltr?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <FieldShell {...base}>
      <input
        id={fid(base.name)}
        name={base.name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        dir={ltr ? "ltr" : undefined}
        className={`input ${ltr ? "ltr" : ""}`}
        aria-invalid={base.error ? true : undefined}
        aria-required={!base.optional || undefined}
        aria-describedby={describedBy(base.name, base.hint, base.error)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  value,
  onChange,
  onBlur,
  maxLength,
  rows = 4,
  ...base
}: BaseProps & { value: string; onChange: (v: string) => void; onBlur?: () => void; maxLength: number; rows?: number }) {
  return (
    <FieldShell {...base} counter={`${value.length} / ${maxLength}`}>
      <textarea
        id={fid(base.name)}
        name={base.name}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="input"
        aria-invalid={base.error ? true : undefined}
        aria-required={!base.optional || undefined}
        aria-describedby={describedBy(base.name, base.hint, base.error)}
      />
    </FieldShell>
  );
}

export function SelectField({
  value,
  onChange,
  onBlur,
  options,
  disabled,
  placeholder,
  ...base
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  const { t } = useLocale();
  return (
    <FieldShell {...base}>
      <select
        id={fid(base.name)}
        name={base.name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="input disabled:opacity-60"
        aria-invalid={base.error ? true : undefined}
        aria-required={!base.optional || undefined}
        aria-describedby={describedBy(base.name, base.hint, base.error)}
      >
        <option value="">{placeholder ?? t.common.select}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Large radio options rendered as cards; native radios keep keyboard and screen-reader behaviour. */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  value,
  onChange,
  options,
  error,
  columns = 2,
  hideLegend,
}: {
  name: string;
  legend: string;
  value: T | null | "";
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string }[];
  error?: string;
  columns?: 2 | 4;
  hideLegend?: boolean;
}) {
  const id = fid(name);
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={hideLegend ? "sr-only" : "field-label"}>{legend}</legend>
      <div className={`grid gap-2.5 ${columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-2"}`} id={id} tabIndex={-1}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-[14px] transition-colors ${
                checked ? "border-signal bg-signal/10 text-ink" : "border-line bg-space-950/40 text-ink-muted hover:border-[#A9B7C9] hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="h-4 w-4 shrink-0 accent-[#1F3556]"
              />
              <span>
                <span className="font-medium">{o.label}</span>
                {o.description && <span className="mt-0.5 block text-[13px] text-ink-muted">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </fieldset>
  );
}

export function StepHeading({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <div className="mb-8 text-center lg:text-start">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 id="step-heading" tabIndex={-1} className="mt-2 text-[24px] font-bold leading-snug outline-none sm:text-[30px]">
        {title}
      </h1>
      {lead && <p className="mx-auto mt-3 max-w-[68ch] text-ink-muted lg:mx-0">{lead}</p>}
    </div>
  );
}
