import Link from "next/link";
import { getStats } from "@/lib/admin-data";
import { getServerDictionary } from "@/lib/server-locale";
import { ACADEMIC_LEVELS, optionLabel } from "@/lib/institution";
import { teamName } from "@/lib/teams";
import { Bars } from "@/components/admin/Bars";
import type { Status } from "@/lib/application";

export default async function OverviewPage() {
  const { t, locale } = await getServerDictionary();
  const s = await getStats();
  const a = t.admin;

  const statusCount = (k: Status) => s.byStatus.find((x) => x.key === k)?.n ?? 0;
  const tiles = [
    { label: a.total, value: s.totals.total, href: "/admin/applications" },
    { label: a.last7, value: s.totals.recent, href: "/admin/applications" },
    { label: t.status.new, value: statusCount("new"), href: "/admin/applications?status=new" },
    { label: t.status.shortlisted, value: statusCount("shortlisted"), href: "/admin/applications?status=shortlisted" },
  ];

  return (
    <div>
      <h1 className="text-[26px] font-bold">{a.overview}</h1>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link href={tile.href} className="panel block p-5 transition-colors hover:border-[#A9B7C9]">
              <p className="text-[13px] text-ink-muted">{tile.label}</p>
              <p className="mt-2 font-display text-[30px] font-bold tabular-nums">{tile.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Bars title={a.byTeam} empty={a.emptyAll} items={s.byTeam.map((x) => ({ label: teamName(x.key, locale), value: x.n }))} />
        <div className="space-y-4">
          <Bars
            title={a.byCategory}
            empty={a.emptyAll}
            items={s.byCategory.map((x) => ({ label: x.key === "technical" ? t.category.technical.title : t.category.nonTechnical.title, value: x.n }))}
          />
          <Bars title={a.byStatus} empty={a.emptyAll} items={s.byStatus.map((x) => ({ label: t.status[x.key as Status] ?? x.key ?? "", value: x.n }))} />
        </div>
        <Bars title={a.byLevel} empty={a.emptyAll} items={s.byLevel.map((x) => ({ label: optionLabel(ACADEMIC_LEVELS, x.key, locale), value: x.n }))} />
        <div className="lg:col-span-2">
          <Bars
            title={a.bySpecialisation}
            empty={a.emptyAll}
            items={s.bySpec.map((x) => ({ label: x.key, value: x.n }))}
          />
        </div>
      </div>
    </div>
  );
}
