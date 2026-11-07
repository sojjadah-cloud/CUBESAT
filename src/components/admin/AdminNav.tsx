"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/Header";
import { LogoMark } from "@/components/Brand";
import type { Role } from "@/lib/auth";

export function AdminNav({ name, role }: { name: string; role: Role }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/admin", label: t.admin.overview, active: pathname === "/admin" },
    { href: "/admin/applications", label: t.admin.applications, active: pathname.startsWith("/admin/applications") },
    ...(role === "admin" ? [{ href: "/admin/audit", label: t.admin.audit, active: pathname.startsWith("/admin/audit") }] : []),
  ];

  const signOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-space-950/90 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="font-display text-[14px] font-bold">{t.common.appName}</span>
              <span className="text-[11px] text-ink-muted">{t.admin.portal}</span>
            </span>
          </Link>
          <nav aria-label={t.admin.portal} className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-medium transition-colors ${
                  l.active ? "bg-mist text-ink" : "text-ink-muted hover:bg-space-900 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-end text-[12px] leading-tight lg:block">
            <span className="block text-ink">{name}</span>
            <span className="text-ink-faint">{t.admin.role[role]}</span>
          </span>
          <LanguageSwitcher />
          <button type="button" onClick={signOut} className="btn-ghost btn-sm" aria-label={t.admin.signOut}>
            <LogOut className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            <span className="hidden sm:inline">{t.admin.signOut}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
