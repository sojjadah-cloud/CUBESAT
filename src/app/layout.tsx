import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Manrope } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getServerLocale } from "@/lib/server-locale";
import { getDictionary } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-ar",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getServerLocale());
  return {
    title: { default: t.common.projectName, template: `%s — ${t.common.appName}` },
    description: t.landing.lead,
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#EEF2F7", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${inter.variable} ${manrope.variable} ${plexArabic.variable}`}>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
