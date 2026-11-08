"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, ImagePlus, Lock, RefreshCw, Trash2, Upload } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { StepHeading, TextField } from "@/components/ui/fields";
import { useWizard } from "@/components/wizard/context";
import type { UploadedFile } from "@/lib/application";
import { formatSize } from "@/lib/format";

type Kind = "image" | "cv";
interface Pending {
  key: string;
  name: string;
  kind: Kind;
  progress: number;
  error?: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";


function uploadWithProgress(file: File, kind: Kind, onProgress: (p: number) => void): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(body);
        else reject(new Error(body.error ?? "upload"));
      } catch {
        reject(new Error("upload"));
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(form);
  });
}

function DropZone({
  kind,
  multiple,
  accept,
  label,
  hint,
  onFiles,
  disabled,
  icon: Icon,
}: {
  kind: Kind;
  multiple: boolean;
  accept: string;
  label: string;
  hint: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  icon: typeof Upload;
}) {
  const { t } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files));
      }}
      className={`flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed px-5 py-8 text-center transition-colors ${
        over ? "border-signal bg-signal/10" : "border-line bg-space-950/40"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <Icon className="h-7 w-7 text-ink-muted" aria-hidden="true" />
      <p className="mt-3 text-[14px] text-ink">
        {label}{" "}
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="font-semibold text-signal underline-offset-4 hover:underline disabled:cursor-not-allowed"
        >
          {t.attachments.browse}
        </button>
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">{hint}</p>
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={accept}
        multiple={multiple}
        data-kind={kind}
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ProgressRow({ p }: { p: Pending }) {
  const { t } = useLocale();
  return (
    <li className="rounded-[10px] border border-line bg-space-950/50 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="truncate text-ink" dir="auto">{p.name}</span>
        <span className={p.error ? "text-[#B42323]" : "text-ink-muted"} dir="ltr">
          {p.error ? "" : `${p.progress}%`}
        </span>
      </div>
      {p.error ? (
        <p className="field-error" role="alert">
          <AlertCircle className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {p.error}
        </p>
      ) : (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={p.progress}
          aria-label={`${t.attachments.uploading} ${p.name}`}
        >
          <div className="h-full rounded-full bg-signal transition-[width]" style={{ width: `${p.progress}%` }} />
        </div>
      )}
    </li>
  );
}

export function AttachmentsStep() {
  const { t } = useLocale();
  const { files, setFiles, limits, data, update, err, touch } = useWizard();
  const a = t.attachments;
  const [pending, setPending] = useState<Pending[]>([]);

  const images = files.filter((f) => f.kind === "image");
  const cv = files.find((f) => f.kind === "cv");

  const errorFor = (e: unknown, kind: Kind) => {
    const code = (e as Error).message;
    if (code === "type") return a.errType;
    if (code === "size") return a.errSize(kind === "image" ? limits.imageMb : limits.cvMb);
    if (code === "count") return a.errCount(limits.maxImages);
    if (code === "network") return t.errors.network;
    return a.errUpload;
  };

  const start = (file: File, kind: Kind) => {
    const key = `${Date.now()}-${Math.random()}`;
    const maxMb = kind === "image" ? limits.imageMb : limits.cvMb;
    const okType = kind === "image" ? IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name) : file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const clientError = !okType ? a.errType : file.size > maxMb * 1024 * 1024 ? a.errSize(maxMb) : undefined;

    setPending((p) => [...p, { key, name: file.name, kind, progress: 0, error: clientError }]);
    if (clientError) {
      setTimeout(() => setPending((p) => p.filter((x) => x.key !== key)), 6000);
      return;
    }
    uploadWithProgress(file, kind, (progress) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))))
      .then((uploaded) => {
        setFiles((fs) => (kind === "cv" ? [...fs.filter((f) => f.kind !== "cv"), uploaded] : [...fs, uploaded]));
        setPending((p) => p.filter((x) => x.key !== key));
      })
      .catch((e) => {
        setPending((p) => p.map((x) => (x.key === key ? { ...x, error: errorFor(e, kind) } : x)));
        setTimeout(() => setPending((p) => p.filter((x) => x.key !== key)), 8000);
      });
  };

  const addImages = (list: File[]) => {
    const room = limits.maxImages - images.length - pending.filter((p) => p.kind === "image" && !p.error).length;
    list.slice(0, Math.max(0, room)).forEach((f) => start(f, "image"));
    if (list.length > room) {
      const key = `count-${Date.now()}`;
      setPending((p) => [...p, { key, name: "", kind: "image", progress: 0, error: a.errCount(limits.maxImages) }]);
      setTimeout(() => setPending((p) => p.filter((x) => x.key !== key)), 6000);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 404) setFiles((fs) => fs.filter((f) => f.id !== id));
  };

  const replaceRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <StepHeading title={a.title} lead={t.common.optional} />

      <section className="panel p-5 sm:p-7" aria-labelledby="img-h">
        <h2 id="img-h" className="text-[18px] font-bold">
          {a.imagesTitle} <span className="text-[13px] font-normal text-ink-faint">({t.common.optional})</span>
        </h2>
        <div className="mt-4">
          <DropZone
            kind="image"
            multiple
            accept={IMAGE_ACCEPT}
            label={a.drop}
            hint={a.imagesHint(limits.imageMb, limits.maxImages)}
            onFiles={addImages}
            disabled={images.length >= limits.maxImages}
            icon={ImagePlus}
          />
        </div>
        {pending.some((p) => p.kind === "image") && (
          <ul className="mt-4 space-y-2" aria-live="polite">
            {pending.filter((p) => p.kind === "image").map((p) => <ProgressRow key={p.key} p={p} />)}
          </ul>
        )}
        {images.length > 0 && (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              <li key={img.id} className="group relative overflow-hidden rounded-[10px] border border-line bg-space-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/uploads/${img.id}`} alt={img.name} className="aspect-[4/3] w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-[12px]">
                  <span className="truncate text-ink-muted" dir="auto">{img.name}</span>
                  <button
                    type="button"
                    onClick={() => remove(img.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-aero/15 hover:text-[#B42323]"
                    aria-label={`${a.remove}: ${img.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel mt-5 p-5 sm:p-7" aria-labelledby="cv-h">
        <h2 id="cv-h" className="text-[18px] font-bold">
          {a.cvTitle} <span className="text-[13px] font-normal text-ink-faint">({t.common.optional})</span>
        </h2>
        <div className="mt-4">
          {cv ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-space-950/50 px-4 py-3">
              <FileText className="h-6 w-6 shrink-0 text-orbit-ink" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-ink" dir="auto">{cv.name}</p>
                <p className="text-[12px] text-ink-faint">{formatSize(cv.size, t)}</p>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => replaceRef.current?.click()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {a.replace}
              </button>
              <button type="button" className="btn-ghost btn-sm hover:text-[#B42323]" onClick={() => remove(cv.id)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {a.remove}
              </button>
              <input
                ref={replaceRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) start(f, "cv");
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <DropZone
              kind="cv"
              multiple={false}
              accept=".pdf,application/pdf"
              label={a.dropCv}
              hint={a.cvHint(limits.cvMb)}
              onFiles={(fs) => fs[0] && start(fs[0], "cv")}
              icon={Upload}
            />
          )}
        </div>
        {pending.some((p) => p.kind === "cv") && (
          <ul className="mt-4 space-y-2" aria-live="polite">
            {pending.filter((p) => p.kind === "cv").map((p) => <ProgressRow key={p.key} p={p} />)}
          </ul>
        )}
      </section>

      <section className="panel mt-5 p-5 sm:p-7">
        <TextField
          name="linkedin"
          label={a.linkedinTitle}
          optional
          value={data.linkedin}
          onChange={(v) => update({ linkedin: v })}
          onBlur={() => touch("linkedin")}
          error={err("linkedin")}
          placeholder={a.linkedinPh}
          type="url"
          inputMode="url"
          autoComplete="url"
          ltr
          maxLength={300}
        />
      </section>

      <p className="mt-5 flex items-start gap-2.5 text-[13px] text-ink-muted">
        <Lock className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {a.privacy}
      </p>
    </div>
  );
}
