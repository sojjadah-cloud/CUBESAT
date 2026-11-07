"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Trash2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { STATUSES, type Status } from "@/lib/application";

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<Response>, onOk: () => void, errorText: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) throw new Error(String(res.status));
      onOk();
    } catch {
      setError(errorText);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export function StatusForm({ id, status }: { id: string; status: Status }) {
  const { t } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState<Status>(status);
  const [done, setDone] = useState(false);
  const { busy, error, run } = useAction();

  const save = () =>
    run(
      () => fetch(`/api/admin/applications/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) }),
      () => {
        setDone(true);
        setTimeout(() => setDone(false), 2500);
        router.refresh();
      },
      t.errors.network,
    );

  return (
    <div>
      <label htmlFor="status" className="field-label">{t.admin.changeStatus}</label>
      <div className="flex gap-2">
        <select id="status" className="input" value={value} onChange={(e) => setValue(e.target.value as Status)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t.status[s]}</option>
          ))}
        </select>
        <button type="button" onClick={save} disabled={busy || value === status} className="btn-primary shrink-0">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : done ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
          {t.admin.updateStatus}
        </button>
      </div>
      <p className="mt-1.5 min-h-[20px] text-[13px]" aria-live="polite">
        {done && <span className="text-signal">{t.admin.statusUpdated}</span>}
        {error && <span className="text-[#B42323]">{error}</span>}
      </p>
    </div>
  );
}

export function NoteForm({ id }: { id: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [text, setText] = useState("");
  const { busy, error, run } = useAction();

  const add = () =>
    run(
      () => fetch(`/api/admin/applications/${id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) }),
      () => {
        setText("");
        router.refresh();
      },
      t.errors.network,
    );

  return (
    <div>
      <label htmlFor="note" className="sr-only">{t.admin.addNote}</label>
      <textarea id="note" className="input min-h-[88px]" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.admin.notesHint} />
      {error && (
        <p className="field-error" role="alert">
          <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <button type="button" onClick={add} disabled={busy || !text.trim()} className="btn-secondary btn-sm mt-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {t.admin.addNote}
      </button>
    </div>
  );
}

export function DeleteApplication({ id }: { id: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const { busy, error, run } = useAction();

  const remove = () => {
    if (!window.confirm(t.admin.deleteConfirm)) return;
    run(
      () => fetch(`/api/admin/applications/${id}`, { method: "DELETE" }),
      () => {
        router.replace("/admin/applications");
        router.refresh();
      },
      t.errors.network,
    );
  };

  return (
    <div>
      <button type="button" onClick={remove} disabled={busy} className="btn-danger btn-sm w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
        {t.admin.deleteApp}
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
