import data from "../../config/institution.json";

export interface Option {
  id: string;
  en: string;
  ar: string;
}
/** Value stored by older applications that typed their own department. */
export const OTHER = "other";

export const ACADEMIC_LEVELS: Option[] = data.academicLevels;
export const DEPARTMENTS: Option[] = data.departments;
export const WEEKLY_HOURS: Option[] = data.weeklyHours;
export const ENGLISH_LEVELS: Option[] = data.englishLevels;

/**
 * Institutional validation rules. These come from environment variables so
 * the organising team can set the real formats without code changes.
 * Nothing here assumes a particular student-ID format.
 */
export interface InstitutionRules {
  /** Regex source for student IDs, or null to accept 3–20 letters/digits. */
  studentIdPattern: string | null;
  studentIdHint: { en: string; ar: string } | null;
}

export function getInstitutionRules(): InstitutionRules {
  const pattern = process.env.STUDENT_ID_PATTERN?.trim() || null;
  if (pattern) {
    try {
      new RegExp(pattern);
    } catch {
      throw new Error(`STUDENT_ID_PATTERN is not a valid regular expression: ${pattern}`);
    }
  }
  const hintEn = process.env.STUDENT_ID_HINT_EN?.trim();
  const hintAr = process.env.STUDENT_ID_HINT_AR?.trim();
  return {
    studentIdPattern: pattern,
    studentIdHint: hintEn || hintAr ? { en: hintEn || hintAr || "", ar: hintAr || hintEn || "" } : null,
  };
}

export const optionLabel = (list: Option[], id: string | null | undefined, locale: "ar" | "en") =>
  list.find((o) => o.id === id)?.[locale] ?? id ?? "";

export function departmentLabel(id: string, other: string | null | undefined, locale: "ar" | "en") {
  if (id === OTHER) return other || (locale === "ar" ? "أخرى" : "Other");
  return optionLabel(DEPARTMENTS, id, locale);
}
