import { ar } from "./ar";
import { en, type Dictionary } from "./en";

export type Locale = "ar" | "en";
export const LOCALES: Locale[] = ["ar", "en"];
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "cs_lang";

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
export const isLocale = (v: unknown): v is Locale => v === "ar" || v === "en";
export const toLocale = (v: unknown): Locale => (isLocale(v) ? v : DEFAULT_LOCALE);

export type { Dictionary };
