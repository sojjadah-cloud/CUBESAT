import type { Metadata } from "next";
import { Wizard } from "@/components/wizard/Wizard";
import { getInstitutionRules } from "@/lib/institution";
import { LIMITS } from "@/lib/files";
import { getServerDictionary } from "@/lib/server-locale";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerDictionary();
  return { title: t.nav.apply };
}

export default function ApplyPage() {
  return <Wizard rules={getInstitutionRules()} limits={LIMITS} />;
}
