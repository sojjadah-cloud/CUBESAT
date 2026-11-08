import { query, queryOne } from "@/lib/db";
import { STATUSES, type ApplicationData, type Experience, type Status } from "@/lib/application";
import { TEAM_IDS } from "@/lib/teams";

export interface ApplicationRow {
  id: string;
  reference: string;
  status: Status;
  category: "technical" | "non_technical";
  primary_team: string;
  secondary_team: string | null;
  full_name: string;
  student_id: string;
  academic_level: string;
  department: string;
  department_other: string | null;
  specialisation: string;
  specialisation_other: string | null;
  phone: string;
  email: string | null;
  experience: Experience;
  skills: string[];
  skills_other: string | null;
  motivation_why: string;
  motivation_contribute: string;
  motivation_learn: string | null;
  weekly_hours: string;
  linkedin: string | null;
  english_level: string | null;
  locale: string;
  created_at: Date;
  updated_at: Date;
}

export interface Filters {
  q?: string;
  team?: string;
  status?: string;
  category?: string;
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters & { page: number } {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  return {
    q: one("q")?.slice(0, 100),
    team: TEAM_IDS.includes(one("team") ?? "") ? one("team") : undefined,
    status: (STATUSES as readonly string[]).includes(one("status") ?? "") ? one("status") : undefined,
    category: ["technical", "non_technical"].includes(one("category") ?? "") ? one("category") : undefined,
    page: Math.max(1, Number(one("page")) || 1),
  };
}

function where(f: Filters) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (f.q) {
    params.push(`%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    clauses.push(`(full_name ILIKE $${params.length} OR student_id ILIKE $${params.length} OR reference ILIKE $${params.length})`);
  }
  if (f.team) {
    params.push(f.team);
    clauses.push(`primary_team = $${params.length}`);
  }
  if (f.status) {
    params.push(f.status);
    clauses.push(`status = $${params.length}`);
  }
  if (f.category) {
    params.push(f.category);
    clauses.push(`category = $${params.length}`);
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", params };
}

export const PAGE_SIZE = 25;

export async function listApplications(f: Filters, page: number) {
  const w = where(f);
  const total = (await queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM applications ${w.sql}`, w.params))?.n ?? 0;
  const rows = await query<Pick<ApplicationRow, "id" | "reference" | "status" | "category" | "primary_team" | "full_name" | "student_id" | "academic_level" | "created_at">>(
    `SELECT id, reference, status, category, primary_team, full_name, student_id, academic_level, created_at
       FROM applications ${w.sql}
      ORDER BY created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    w.params,
  );
  return { total, rows, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function exportApplications(f: Filters) {
  const w = where(f);
  return query<ApplicationRow & { file_count: number }>(
    `SELECT a.*, (SELECT count(*)::int FROM files WHERE application_id = a.id) AS file_count
       FROM applications a ${w.sql} ORDER BY created_at DESC`,
    w.params,
  );
}

export async function getApplication(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return queryOne<ApplicationRow>(`SELECT * FROM applications WHERE id = $1`, [id]);
}

export async function getStats() {
  const count = async (col: string) =>
    query<{ key: string | null; n: number }>(`SELECT ${col} AS key, count(*)::int AS n FROM applications GROUP BY 1 ORDER BY 2 DESC`);
  const [totals, byTeam, byLevel, bySpec, byStatus, byCategory] = await Promise.all([
    queryOne<{ total: number; recent: number }>(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS recent FROM applications`,
    ),
    count("primary_team"),
    count("academic_level"),
    query<{ key: string; n: number }>(
      `SELECT min(trim(coalesce(specialisation_other, specialisation))) AS key, count(*)::int AS n
         FROM applications
        GROUP BY lower(trim(coalesce(specialisation_other, specialisation)))
        ORDER BY 2 DESC LIMIT 12`,
    ),
    count("status"),
    count("category"),
  ]);
  return { totals: totals ?? { total: 0, recent: 0 }, byTeam, byLevel, bySpec, byStatus, byCategory };
}

export function rowToData(r: ApplicationRow): ApplicationData {
  return {
    category: r.category,
    primaryTeam: r.primary_team,
    fullName: r.full_name,
    studentId: r.student_id,
    academicLevel: r.academic_level,
    department: r.department,
    specialisation: r.specialisation_other ?? r.specialisation,
    phone: r.phone,
    experience: r.experience,
    skills: r.skills ?? [],
    skillsOther: r.skills_other ?? "",
    motivationWhy: r.motivation_why,
    motivationContribute: r.motivation_contribute,
    motivationLearn: r.motivation_learn ?? "",
    weeklyHours: r.weekly_hours,
    linkedin: r.linkedin ?? "",
    englishLevel: r.english_level ?? "",
    consent: true,
  };
}
