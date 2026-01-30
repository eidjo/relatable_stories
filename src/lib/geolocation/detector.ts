import { browser } from '$app/environment';
import type { CountryCode } from '$lib/types';
import { countries } from '$lib/data/contexts';

const DEFAULT_COUNTRY: CountryCode = 'US';

/**
 * Build timezone to country mapping from countries data
 */
function buildTimezoneMap(): Record<string, CountryCode> {
  const map: Record<string, CountryCode> = {};
  for (const country of countries) {
    for (const timezone of country.timezones) {
      map[timezone] = country.code;
    }
  }
  return map;
}

const TIMEZONE_TO_COUNTRY = buildTimezoneMap();

/**
 * Detect country from browser timezone
 */
function detectFromTimezone(): CountryCode | null {
  if (!browser) return null;

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`Browser timezone: ${timezone}`);

    // Direct timezone match
    if (TIMEZONE_TO_COUNTRY[timezone]) {
      return TIMEZONE_TO_COUNTRY[timezone];
    }

    // Try to match by region (e.g., "America/Something" -> might be US/CA)
    const region = timezone.split('/')[0];
    if (region === 'America') {
      // Could be US or CA - check timezone name
      if (
        timezone.includes('Canada') ||
        timezone.includes('Toronto') ||
        timezone.includes('Vancouver')
      ) {
        return 'CA';
      }
      return 'US'; // Default to US for America/* timezones
    }

    console.log(`Timezone ${timezone} not mapped to a country`);
    return null;
  } catch (error) {
    console.warn('Failed to detect country from timezone:', error);
    return null;
  }
}

/**
 * Detect country from browser locale
 */
function detectFromLocale(): CountryCode | null {
  if (!browser) return null;

  try {
    const locale = navigator.language || navigator.languages?.[0] || '';

    // Map common locales to country codes
    const localeMap: Record<string, CountryCode> = {
      'en-US': 'US',
      'en-GB': 'UK',
      'en-CA': 'CA',
      'en-AU': 'AU',
      de: 'DE',
      'de-DE': 'DE',
      'de-AT': 'DE',
      'de-CH': 'DE',
      fr: 'FR',
      'fr-FR': 'FR',
      'fr-CA': 'CA',
      'fr-BE': 'FR',
      es: 'ES',
      'es-ES': 'ES',
      it: 'IT',
      'it-IT': 'IT',
      nl: 'NL',
      'nl-NL': 'NL',
      'nl-BE': 'BE',
      sv: 'SE',
      'sv-SE': 'SE',
      cs: 'CZ',
      'cs-CZ': 'CZ',
      pt: 'BR',
      'pt-BR': 'BR',
    };

    // Try exact match first
    if (localeMap[locale]) {
      return localeMap[locale];
    }

    // Try language code only
    const langCode = locale.split('-')[0];
    for (const [key, value] of Object.entries(localeMap)) {
      if (key.startsWith(langCode)) {
        return value;
      }
    }
  } catch (error) {
    console.warn('Failed to detect country from locale:', error);
  }

  return null;
}

/**
 * Detect user's country with multiple strategies:
 * 1. Try timezone detection (most reliable, no API calls)
 * 2. Fall back to browser locale detection
 * 3. Fall back to default country (US)
 */
export async function detectCountry(): Promise<CountryCode> {
  // Try timezone detection first (most reliable)
  const timezoneCountry = detectFromTimezone();
  if (timezoneCountry) {
    console.log(`Country detected from timezone: ${timezoneCountry}`);
    return timezoneCountry;
  }

  // Fall back to locale detection
  const localeCountry = detectFromLocale();
  if (localeCountry) {
    console.log(`Country detected from locale: ${localeCountry}`);
    return localeCountry;
  }

  // Final fallback
  console.log(`Using default country: ${DEFAULT_COUNTRY}`);
  return DEFAULT_COUNTRY;
}

/**
 * Synchronous country detection (timezone + locale)
 * Used for immediate initialization
 */
export function detectCountrySync(): CountryCode {
  return detectFromTimezone() || detectFromLocale() || DEFAULT_COUNTRY;
}
