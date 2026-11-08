"use client";

import { createContext, useContext } from "react";
import type { ApplicationData, FieldErrors, StepId, UploadedFile } from "@/lib/application";
import type { InstitutionRules } from "@/lib/institution";

export type NoticeKey = "restored" | "changed";

export interface Limits {
  imageMb: number;
  cvMb: number;
  maxImages: number;
}

export interface WizardContextValue {
  data: ApplicationData;
  update: (patch: Partial<ApplicationData> | ((d: ApplicationData) => Partial<ApplicationData>)) => void;
  /** Translated error for a field, shown once the field was touched or Continue was pressed. */
  err: (key: string) => string | undefined;
  /** Raw (unfiltered) error keys for the current step. */
  errors: FieldErrors;
  touch: (key: string) => void;
  rules: InstitutionRules;
  limits: Limits;
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  goTo: (step: StepId) => void;
  notice: NoticeKey | null;
  setNotice: (n: NoticeKey | null) => void;
  appliedTeams: string[];
}

export const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside the application wizard");
  return ctx;
}
