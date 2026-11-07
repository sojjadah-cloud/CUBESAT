"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/Header";
import { LogoMark } from "@/components/Brand";

export function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"invalid" | "rate" | "network" | "missing" | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError("missing");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError(res.status === 429 ? "rate" : "invalid");
    } catch {
      setError("network");
    } finally {
      setBusy(false);
    }
  };

  const message = error === "missing" ? t.admin.missingLogin : error === "invalid" ? t.admin.invalidLogin : error === "rate" ? t.review.rateLimited : error ? t.errors.network : null;

  return (
    <main id="main" className="relative grid min-h-dvh place-items-center px-4 py-12">
      <div aria-hidden="true" className="starfield absolute inset-0 opacity-50" />
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="relative w-full max-w-[400px]">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <span className="font-display text-[17px] font-bold">{t.common.appName}</span>
        </Link>
        <form onSubmit={submit} className="panel mt-8 space-y-5 p-6 sm:p-8" noValidate>
          <div>
            <h1 className="flex items-center gap-2 text-[20px] font-bold">
              <Lock className="h-4 w-4 text-orbit-ink" aria-hidden="true" />
              {t.admin.signInTitle}
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-muted">{t.admin.signInLead}</p>
          </div>
          <div>
            <label htmlFor="email" className="field-label">{t.admin.email}</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="input ltr" dir="ltr" />
          </div>
          <div>
            <label htmlFor="password" className="field-label">{t.admin.password}</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input ltr" dir="ltr" />
          </div>
          {message && (
            <p className="field-error" role="alert">
              <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {message}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? t.admin.signingIn : t.admin.signIn}
          </button>
        </form>
      </div>
    </main>
  );
}
