import { format as dateFnsFormat } from 'date-fns';
import type { Locale } from 'date-fns';

// Import all possible date-fns locales
// Add new locales here as they become supported
import { cs } from 'date-fns/locale/cs';
import { de } from 'date-fns/locale/de';
import { el } from 'date-fns/locale/el';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { fi } from 'date-fns/locale/fi';
import { fr } from 'date-fns/locale/fr';
import { it } from 'date-fns/locale/it';
import { nl } from 'date-fns/locale/nl';
import { nb } from 'date-fns/locale/nb';
import { pl } from 'date-fns/locale/pl';
import { pt } from 'date-fns/locale/pt';
import { ro } from 'date-fns/locale/ro';
import { sv } from 'date-fns/locale/sv';
import { faIR } from 'date-fns/locale/fa-IR';

// Comprehensive locale mapping
// Maps language codes to date-fns locale objects
const localeMap: Record<string, Locale> = {
  en: enUS,
  cs: cs,
  de: de,
  el: el,
  es: es,
  fi: fi,
  fr: fr,
  it: it,
  nl: nl,
  no: nb, // Norwegian
  da: nb, // Danish (use Norwegian as fallback - very similar)
  pl: pl,
  pt: pt,
  ro: ro,
  sv: sv,
  fa: faIR, // Farsi/Persian
};

/**
 * Get the date-fns locale object for a given language code
 * Falls back to English (enUS) if locale not found
 */
export function getLocale(languageCode: string): Locale {
  return localeMap[languageCode] || enUS;
}

/**
 * Format a date with the appropriate locale
 * @param date - Date to format (Date object or string)
 * @param formatStr - date-fns format string (e.g., 'PP', 'PPP', 'PPPp')
 * @param languageCode - Language code from country-languages.yaml
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, formatStr: string, languageCode: string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const locale = getLocale(languageCode);
    return dateFnsFormat(dateObj, formatStr, { locale });
  } catch {
    // Fallback to string representation if parsing fails
    return typeof date === 'string' ? date : date.toISOString();
  }
}

/**
 * Get all available locale mappings
 * Useful for debugging or validation
 */
export function getAvailableLocales(): string[] {
  return Object.keys(localeMap);
}
