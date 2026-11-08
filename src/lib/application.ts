import { z } from "zod";
import { TEAMS, SKILL_IDS, type Category } from "@/lib/teams";
import { ACADEMIC_LEVELS, DEPARTMENTS, ENGLISH_LEVELS, WEEKLY_HOURS, type InstitutionRules } from "@/lib/institution";

/* ────────────────────────── Data shape ────────────────────────── */

/** Every experience entry (workshop, course, competition, project) has the same three parts. */
export interface ExperienceEntry {
  id: string;
  /** Name of the workshop / course / competition / project. */
  name: string;
  /** Where it took place or who ran it. */
  where: string;
  /** Anything else the student wants to share about it (optional). */
  details: string;
}

export interface ExperienceGroup<T> { has: boolean | null; entries: T[] }
export interface Experience {
  workshops: ExperienceGroup<ExperienceEntry>;
  courses: ExperienceGroup<ExperienceEntry>;
  competitions: ExperienceGroup<ExperienceEntry>;
  projects: ExperienceGroup<ExperienceEntry>;
}
export type ExperienceKey = keyof Experience;
export const EXPERIENCE_KEYS: ExperienceKey[] = ["workshops", "courses", "competitions", "projects"];

export interface UploadedFile { id: string; kind: "image" | "cv"; name: string; size: number; mime: string }

export interface ApplicationData {
  category: Category | null;
  /** The single team the student applies to. */
  primaryTeam: string | null;
  fullName: string;
  studentId: string;
  academicLevel: string;
  department: string;
  /** Typed by the student. */
  specialisation: string;
  phone: string;
  englishLevel: string;
  experience: Experience;
  skills: string[];
  skillsOther: string;
  motivationWhy: string;
  motivationContribute: string;
  motivationLearn: string;
  weeklyHours: string;
  /** Optional LinkedIn profile link (attachments step). */
  linkedin: string;
  consent: boolean;
}

export const emptyApplication = (): ApplicationData => ({
  category: null,
  primaryTeam: null,
  fullName: "",
  studentId: "",
  academicLevel: "",
  department: "",
  specialisation: "",
  phone: "",
  englishLevel: "",
  experience: {
    workshops: { has: null, entries: [] },
    courses: { has: null, entries: [] },
    competitions: { has: null, entries: [] },
    projects: { has: null, entries: [] },
  },
  skills: [],
  skillsOther: "",
  motivationWhy: "",
  motivationContribute: "",
  motivationLearn: "",
  weeklyHours: "",
  linkedin: "",
  consent: false,
});

export const newEntry = (id: string): ExperienceEntry => ({ id, name: "", where: "", details: "" });

export const MAX_ENTRIES = 10;

/* ────────────────────────── Validation ────────────────────────── */

/** Error codes; translated by the UI via dictionary.errors. */
export type ErrorCode =
  | "required" | "choose" | "email" | "emailDomain" | "studentId" | "phone" | "year" | "url"
  | "tooLong" | "tooShort" | "consent" | "linkedin" | "invalid" | "entries";

export type FieldErrors = Record<string, ErrorCode>;

const req = (max = 200) => z.string().trim().min(1, "required").max(max, "tooLong");
const opt = (max = 500) => z.string().trim().max(max, "tooLong");

const entry = z.object({ id: z.string(), name: req(), where: req(), details: opt(1000) });

// Entries are only validated when the student answered "Yes": fields left over
// from switching Yes → No are hidden and must never block the form.
const group = <T extends z.ZodTypeAny>(entry: T) =>
  z
    .object({ has: z.boolean().nullable(), entries: z.array(z.unknown()).max(MAX_ENTRIES, "tooLong") })
    .superRefine((g, ctx) => {
      if (g.has === null) ctx.addIssue({ code: "custom", path: ["has"], message: "choose" });
      if (g.has !== true) return;
      if (g.entries.length === 0) ctx.addIssue({ code: "custom", path: ["entries"], message: "entries" });
      g.entries.forEach((e, i) => {
        const r = entry.safeParse(e);
        if (!r.success)
          for (const issue of r.error.issues)
            ctx.addIssue({ code: "custom", path: ["entries", i, ...issue.path], message: issue.message });
      });
    })
    // "No experience" discards any entries the student typed before switching.
    .transform((g) => ({
      has: g.has,
      entries: g.has ? g.entries.map((e) => entry.parse(e) as z.infer<T>) : ([] as z.infer<T>[]),
    }));

const normalisePhone = (v: string) => v.replace(/[\s\-()]/g, "");
export const isValidPhone = (raw: string) => {
  const v = normalisePhone(raw);
  // Omani mobile (8 digits starting 7 or 9), optional +968 / 00968, or any international number.
  return /^(?:\+968|00968)?[79]\d{7}$/.test(v) || /^\+\d{8,15}$/.test(v) || /^00\d{8,15}$/.test(v);
};

export const normaliseStudentId = (v: string) => v.trim().toUpperCase().replace(/\s+/g, "");

export function buildSchemas(rules: InstitutionRules) {
  const studentIdRe = rules.studentIdPattern ? new RegExp(rules.studentIdPattern) : /^[A-Za-z0-9-]{3,20}$/;

  const category = z.object({
    category: z.enum(["technical", "non_technical"], { errorMap: () => ({ message: "choose" }) }),
  });

  const teams = z
    .object({
      category: z.enum(["technical", "non_technical"]),
      primaryTeam: z.string({ invalid_type_error: "choose" }).min(1, "choose"),
    })
    .superRefine((d, ctx) => {
      const p = TEAMS.find((t) => t.id === d.primaryTeam);
      if (!p || p.category !== d.category) ctx.addIssue({ code: "custom", path: ["primaryTeam"], message: "choose" });
    });

  const student = z
    .object({
      fullName: req(120).refine((v) => v.length >= 3, "tooShort"),
      studentId: req(40).refine((v) => studentIdRe.test(v.trim()), "studentId"),
      academicLevel: z.string().refine((v) => ACADEMIC_LEVELS.some((l) => l.id === v), "choose"),
      department: z.string().refine((v) => DEPARTMENTS.some((d) => d.id === v), "choose"),
      specialisation: req(120),
      phone: req(30).refine(isValidPhone, "phone"),
      englishLevel: z.string().refine((v) => ENGLISH_LEVELS.some((l) => l.id === v), "choose"),
    });

  const experience = z.object({
    experience: z.object({
      workshops: group(entry),
      courses: group(entry),
      competitions: group(entry),
      projects: group(entry),
    }),
  });

  const motivation = z.object({
    skills: z.array(z.string().refine((v) => SKILL_IDS.includes(v), "invalid")).max(40),
    skillsOther: opt(300),
    motivationWhy: req(1500).refine((v) => v.trim().length >= 20, "tooShort"),
    motivationContribute: req(1500),
    motivationLearn: req(1500),
    weeklyHours: z.string().refine((v) => WEEKLY_HOURS.some((h) => h.id === v), "choose"),
  });

  const attachments = z.object({
    linkedin: z
      .string()
      .trim()
      .max(300, "tooLong")
      .refine((v) => {
        if (!v) return true;
        try {
          const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
          return /(^|\.)linkedin\.com$/i.test(u.hostname);
        } catch {
          return false;
        }
      }, "linkedin"),
  });

  const review = z.object({ consent: z.literal(true, { errorMap: () => ({ message: "consent" }) }) });

  return { category, teams, student, experience, motivation, attachments, review };
}

/** "student" = basic information; "experience" = skills, experience and motivation. */
export type StepId = "category" | "teams" | "student" | "experience" | "attachments" | "review";
export const STEPS: StepId[] = ["category", "teams", "student", "experience", "attachments", "review"];

function collect(result: z.SafeParseReturnType<unknown, unknown>): FieldErrors {
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = (issue.message as ErrorCode) || "invalid";
  }
  return errors;
}

export function validateStep(step: StepId, data: ApplicationData, rules: InstitutionRules): FieldErrors {
  const s = buildSchemas(rules);
  switch (step) {
    case "category": return collect(s.category.safeParse(data));
    case "teams": return collect(s.teams.safeParse(data));
    case "student": return collect(s.student.safeParse(data));
    case "experience": {
      // Skills, experience and motivation share one step; report all their errors together.
      const a = collect(s.motivation.safeParse(data));
      const b = collect(s.experience.safeParse(data));
      return { ...b, ...a };
    }
    case "attachments": return collect(s.attachments.safeParse(data));
    case "review": return collect(s.review.safeParse(data));
  }
}

/** Full server-side validation; returns cleaned data or field errors with their step. */
export function validateApplication(input: unknown, rules: InstitutionRules) {
  const s = buildSchemas(rules);
  const full = s.category
    .and(s.teams)
    .and(s.student)
    .and(s.experience)
    .and(s.motivation)
    .and(s.attachments)
    .and(s.review);
  const result = full.safeParse(input);
  if (result.success) return { ok: true as const, data: result.data };
  const errors = collect(result);
  const order: StepId[] = ["category", "teams", "student", "experience", "attachments", "review"];
  const raw = (input ?? {}) as ApplicationData;
  const step = order.find((st) => Object.keys(validateStep(st, raw, rules)).length > 0) ?? "review";
  return { ok: false as const, errors, step };
}

export type ValidApplication = z.infer<ReturnType<typeof buildSchemas>["category"]> &
  z.infer<ReturnType<typeof buildSchemas>["teams"]> &
  z.infer<ReturnType<typeof buildSchemas>["student"]> &
  z.infer<ReturnType<typeof buildSchemas>["experience"]> &
  z.infer<ReturnType<typeof buildSchemas>["motivation"]>;

export const STATUSES = ["new", "under_review", "shortlisted", "accepted", "not_selected"] as const;
export type Status = (typeof STATUSES)[number];
