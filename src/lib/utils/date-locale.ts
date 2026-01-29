/**
 * Date localization utilities using date-fns locales
 */

import { format } from 'date-fns';
import { enUS, cs, fr, de, es, it, nl, sv, nb, da, fi, pl, pt } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const localeMap: Record<string, Locale> = {
  en: enUS,
  cs: cs,
  fr: fr,
  de: de,
  es: es,
  it: it,
  nl: nl,
  sv: sv,
  no: nb, // Norwegian Bokmål
  da: da,
  fi: fi,
  pl: pl,
  pt: pt,
  // Add more as needed
};

/**
 * Format a date string for a specific language
 * @param dateString - ISO date string (e.g., "2022-09-20")
 * @param languageCode - Language code (e.g., "cs", "fr")
 * @param formatString - date-fns format string (default: "PPP" = long date)
 */
export function formatDateLocalized(
  dateString: string,
  languageCode: string = 'en',
  formatString: string = 'PPP'
): string {
  try {
    const date = new Date(dateString);
    const locale = localeMap[languageCode] || localeMap['en'];
    return format(date, formatString, { locale });
  } catch (error) {
    console.warn(`Failed to format date: ${dateString}`, error);
    return dateString;
  }
}

/**
 * Get the date-fns locale for a language code
 */
export function getLocale(languageCode: string): Locale {
  return localeMap[languageCode] || localeMap['en'];
}
