import { LanguageCode, TranslationDictionary } from "../types";
import { en } from "./en";
import { ml } from "./ml";
import { id } from "./id";
import { ru } from "./ru";
import { ar } from "./ar";
import { hi } from "./hi";
import { ta } from "./ta";
import { kn } from "./kn";
import { te } from "./te";
import { bn } from "./bn";
import { fr } from "./fr";
import { es } from "./es";

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en,
  ml,
  id,
  ru,
  ar,
  hi,
  ta,
  kn,
  te,
  bn,
  fr,
  es,
};

export function getTranslation(lang: LanguageCode, key: keyof TranslationDictionary): string {
  const dict = translations[lang] || translations.en;
  const val = dict[key];
  if (val !== undefined && val !== null && val !== "") {
    return val;
  }
  return translations.en[key] || String(key);
}
