import { notFound } from "next/navigation";
import { TeamDetailPage } from "@/components/site/TeamsPages";
import { TEAM_IDS } from "@/lib/teams";

export function generateStaticParams() {
  return TEAM_IDS.map((id) => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!TEAM_IDS.includes(id)) notFound();
  return <TeamDetailPage id={id} />;
}
