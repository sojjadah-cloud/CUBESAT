import { cookies } from "next/headers";
import { getDictionary, LOCALE_COOKIE, toLocale, type Locale } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies();
  return toLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function getServerDictionary() {
  const locale = await getServerLocale();
  return { locale, t: getDictionary(locale) };
}
