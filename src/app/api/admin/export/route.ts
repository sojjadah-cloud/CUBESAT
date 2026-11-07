import { requireAdminApi } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { exportApplications, parseFilters } from "@/lib/admin-data";
import { ACADEMIC_LEVELS, WEEKLY_HOURS, departmentLabel, optionLabel, specialisationLabel } from "@/lib/institution";
import { EXPERIENCE_KEYS } from "@/lib/application";
import { skillById, teamName } from "@/lib/teams";
import { clientIp, json } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Escapes a CSV cell and neutralises spreadsheet formula injection. */
function cell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const user = await requireAdminApi(["admin"]);
  if (!user) return json({ error: "forbidden" }, 403);

  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const filters = parseFilters(sp);
  const rows = await exportApplications(filters);
  const L = "en" as const;

  const header = [
    "Reference", "Submitted", "Status", "Category", "Team",
    "Full name", "Student ID", "Academic level", "Department", "Specialisation", "Mobile", "Email",
    "Workshops", "Courses", "Competitions", "Projects", "Skills", "Other skills",
    "Why join", "Expected contribution", "Wants to learn", "Weekly hours", "Attachments", "Form language",
  ];
  const lines = rows.map((r) => {
    const exp = Object.fromEntries(
      EXPERIENCE_KEYS.map((k) => {
        const g = r.experience?.[k];
        if (!g?.has || !g.entries?.length) return [k, "None"];
        const names = g.entries.map((e) => {
          const x = e as unknown as Record<string, string>;
          return [x.title || x.name, x.organiser || x.provider, x.year].filter(Boolean).join(" — ");
        });
        return [k, names.join(" | ")];
      }),
    );
    return [
      r.reference,
      new Date(r.created_at).toISOString(),
      r.status,
      r.category === "technical" ? "Technical" : "Non-technical",
      teamName(r.primary_team, L),
      r.full_name,
      r.student_id,
      optionLabel(ACADEMIC_LEVELS, r.academic_level, L),
      departmentLabel(r.department, r.department_other, L),
      specialisationLabel(r.department, r.specialisation, r.specialisation_other, L),
      r.phone,
      r.email,
      exp.workshops, exp.courses, exp.competitions, exp.projects,
      (r.skills ?? []).map((s) => skillById(s)?.label.en ?? s).join(", "),
      r.skills_other ?? "",
      r.motivation_why,
      r.motivation_contribute,
      r.motivation_learn ?? "",
      optionLabel(WEEKLY_HOURS, r.weekly_hours, L),
      r.file_count,
      r.locale,
    ].map(cell).join(",");
  });

  await audit(user, "application.export", { type: "application" }, { count: rows.length, filters }, clientIp(req));

  // UTF-8 BOM so Excel renders Arabic names correctly.
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mtc-cubesat-applications-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
