import { requireAdminPage } from "@/lib/auth";
import { getServerDictionary } from "@/lib/server-locale";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { t } = await getServerDictionary();
  return { title: t.admin.portal, robots: { index: false } };
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <>
      <AdminNav name={user.name} role={user.role} local={user.local} />
      <main id="main" className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
