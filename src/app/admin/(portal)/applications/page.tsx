import Link from "next/link";
import { Download, Search } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { listApplications, parseFilters } from "@/lib/admin-data";
import { getServerDictionary } from "@/lib/server-locale";
import { ACADEMIC_LEVELS, ENGLISH_LEVELS, departmentLabel, optionLabel } from "@/lib/institution";
import { STATUSES } from "@/lib/application";
import { TEAMS, teamName } from "@/lib/teams";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function ApplicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireAdminPage();
  const { t, locale } = await getServerDictionary();
  const a = t.admin;
  const f = parseFilters(await searchParams);
  const page = f.page;
  const { rows, total, pages } = await listApplications(f, page);

  const qs = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: f.q, team: f.team, status: f.status, category: f.category, ...extra })) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const filtered = Boolean(f.q || f.team || f.status || f.category);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold">{a.applications}</h1>
          <p className="mt-1 text-[14px] text-ink-muted">{a.results(total)}</p>
        </div>
        {user.role === "admin" && (
          <a href={`/api/admin/export${qs({})}`} className="btn-secondary btn-sm">
            <Download className="h-4 w-4" aria-hidden="true" />
            {a.export}
          </a>
        )}
      </div>

      <form method="get" className="panel mt-6 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <label className="relative block">
          <span className="sr-only">{a.search}</span>
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input name="q" defaultValue={f.q} placeholder={a.search} className="input ps-10" />
        </label>
        <label>
          <span className="sr-only">{a.team}</span>
          <select name="team" defaultValue={f.team ?? ""} className="input md:w-[220px]">
            <option value="">{a.allTeams}</option>
            {TEAMS.map((team) => (
              <option key={team.id} value={team.id}>
                {teamName(team.id, locale)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">{a.byCategory}</span>
          <select name="category" defaultValue={f.category ?? ""} className="input md:w-[170px]">
            <option value="">{a.allCategories}</option>
            <option value="technical">{t.category.technical.title}</option>
            <option value="non_technical">{t.category.nonTechnical.title}</option>
          </select>
        </label>
        <label>
          <span className="sr-only">{a.status}</span>
          <select name="status" defaultValue={f.status ?? ""} className="input md:w-[170px]">
            <option value="">{a.allStatuses}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1">
            {a.filter}
          </button>
          {filtered && (
            <Link href="/admin/applications" className="btn-ghost">
              {a.reset}
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="panel mt-6 px-6 py-16 text-center text-ink-muted">{filtered ? a.empty : a.emptyAll}</div>
      ) : (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-start text-[14px]">
            <thead>
              <tr className="border-b border-line text-[12px] text-ink-muted">
                <th scope="col" className="px-4 py-3 text-start font-medium">{a.name}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{a.reference}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{a.team}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{t.student.academicLevel}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{t.student.department}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{t.student.englishLevel}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{t.student.phone}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{a.submitted}</th>
                <th scope="col" className="px-4 py-3 text-start font-medium">{a.status}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{a.viewReport}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-space-900/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${r.id}`} className="font-medium text-ink hover:text-signal">
                      {r.full_name}
                    </Link>
                    <div className="text-[12px] text-ink-faint" dir="ltr">{r.student_id}</div>
                  </td>
                  <td className="px-4 py-3 font-display text-[13px] text-ink-muted" dir="ltr">{r.reference}</td>
                  <td className="px-4 py-3">{teamName(r.primary_team, locale)}</td>
                  <td className="px-4 py-3 text-ink-muted">{optionLabel(ACADEMIC_LEVELS, r.academic_level, locale)}</td>
                  <td className="px-4 py-3 text-ink-muted">{departmentLabel(r.department, r.department_other, locale)}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.english_level ? optionLabel(ENGLISH_LEVELS, r.english_level, locale) : "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted" dir="ltr">{r.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{fmt.format(new Date(r.created_at))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} label={t.status[r.status]} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${r.id}`} className="btn-secondary btn-sm whitespace-nowrap">
                      {a.viewReport}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-5 flex items-center justify-between text-[14px]" aria-label={a.pagination}>
          {page > 1 ? <Link className="btn-secondary btn-sm" href={`/admin/applications${qs({ page: page - 1 })}`}>{a.prev}</Link> : <span />}
          <span className="text-ink-muted">{a.page(page, pages)}</span>
          {page < pages ? <Link className="btn-secondary btn-sm" href={`/admin/applications${qs({ page: page + 1 })}`}>{a.next}</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
