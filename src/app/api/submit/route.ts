import crypto from "node:crypto";
import { queryOne, transaction } from "@/lib/db";
import { getDraft, clearDraftCookie } from "@/lib/drafts";
import { getInstitutionRules } from "@/lib/institution";
import { normaliseStudentId, validateApplication } from "@/lib/application";
import { isLocale } from "@/lib/i18n";
import { clientIp, forbidden, json, rateLimit, sameOrigin, tooMany } from "@/lib/security";

export const dynamic = "force-dynamic";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeReference() {
  const bytes = crypto.randomBytes(6);
  const code = Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
  return `MTC-CS-${new Date().getFullYear()}-${code}`;
}

const isUniqueViolation = (err: unknown, constraint?: string) => {
  const e = err as { code?: string; constraint?: string; message?: string };
  if (e?.code !== "23505") return false;
  return !constraint || e.constraint === constraint || (e.message ?? "").includes(constraint);
};

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  if (!rateLimit(`submit:${clientIp(req)}`, 6, 60_000)) return tooMany();

  let body: { data?: unknown; submissionKey?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const submissionKey = typeof body.submissionKey === "string" ? body.submissionKey : "";
  if (!/^[0-9a-f-]{36}$/i.test(submissionKey)) return json({ error: "invalid" }, 400);
  const locale = isLocale(body.locale) ? body.locale : "ar";

  // Idempotency: a retried request with the same key returns the original result.
  const existing = await queryOne<{ reference: string }>(
    `SELECT reference FROM applications WHERE submission_key = $1`,
    [submissionKey],
  );
  if (existing) return json({ reference: existing.reference });

  const result = validateApplication(body.data, getInstitutionRules());
  if (!result.ok) return json({ error: "validation", errors: result.errors, step: result.step }, 422);
  const d = result.data;

  const studentIdNorm = normaliseStudentId(d.studentId);
  const dup = await queryOne(`SELECT 1 FROM applications WHERE student_id_norm = $1`, [studentIdNorm]);
  if (dup) return json({ error: "duplicate" }, 409);

  const draft = await getDraft(false);

  try {
    const reference = await transaction(async (tx) => {
      let ref = makeReference();
      for (let i = 0; i < 3; i++) {
        const clash = await tx.query(`SELECT 1 FROM applications WHERE reference = $1`, [ref]);
        if (clash.length === 0) break;
        ref = makeReference();
      }
      const [app] = await tx.query<{ id: string }>(
        `INSERT INTO applications (
           reference, submission_key, category, primary_team, secondary_team,
           full_name, student_id, student_id_norm, academic_level, department, department_other,
           specialisation, specialisation_other, phone, email, experience, skills, skills_other,
           motivation_why, motivation_contribute, motivation_learn, weekly_hours, locale, consent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18,$19,$20,$21,$22,$23, now())
         RETURNING id`,
        [
          ref, submissionKey, d.category, d.primaryTeam, null,
          d.fullName.trim(), d.studentId.trim(), studentIdNorm, d.academicLevel, d.department,
          null,
          d.specialisation.trim(), null,
          d.phone.trim(), null,
          JSON.stringify(d.experience), JSON.stringify(Array.from(new Set(d.skills))), d.skillsOther.trim() || null,
          d.motivationWhy.trim(), d.motivationContribute.trim(), d.motivationLearn.trim() || null,
          d.weeklyHours, locale,
        ],
      );
      if (draft) {
        await tx.query(`UPDATE files SET application_id = $1, draft_id = NULL WHERE draft_id = $2 AND application_id IS NULL`, [app.id, draft.id]);
        await tx.query(`DELETE FROM drafts WHERE id = $1`, [draft.id]);
      }
      return ref;
    });
    await clearDraftCookie();
    return json({ reference }, 201);
  } catch (err) {
    if (isUniqueViolation(err, "submission_key")) {
      const again = await queryOne<{ reference: string }>(`SELECT reference FROM applications WHERE submission_key = $1`, [submissionKey]);
      if (again) return json({ reference: again.reference });
    }
    if (isUniqueViolation(err, "student_id_norm")) return json({ error: "duplicate" }, 409);
    console.error("Submission failed", err);
    return json({ error: "server" }, 500);
  }
}
