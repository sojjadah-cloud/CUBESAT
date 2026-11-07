import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { getServerDictionary } from "@/lib/server-locale";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getServerDictionary();
  return { title: t.admin.signIn, robots: { index: false } };
}

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return <LoginForm />;
}
