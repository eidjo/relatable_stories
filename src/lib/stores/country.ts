import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { CountryCode, TranslationContext } from '$lib/types';
import { getCountryByCode, getCountryNames, getCountryPlaces } from '$lib/data/contexts';

const STORAGE_KEY = 'selected-country';
const DEFAULT_COUNTRY: CountryCode = 'US';

/**
 * Detect country from browser (timezone + locale heuristics)
 */
function detectCountry(): CountryCode {
  if (!browser) return DEFAULT_COUNTRY;

  try {
    // Get locale from browser
    const locale = navigator.language || navigator.languages?.[0] || '';

    // Map common locales to country codes
    const localeMap: Record<string, CountryCode> = {
      'en-US': 'US',
      'en-GB': 'UK',
      'en-CA': 'CA',
      'en-AU': 'AU',
      'de': 'DE',
      'de-DE': 'DE',
      'fr': 'FR',
      'fr-FR': 'FR',
      'es': 'ES',
      'es-ES': 'ES',
      'it': 'IT',
      'it-IT': 'IT',
      'nl': 'NL',
      'nl-NL': 'NL',
      'sv': 'SE',
      'sv-SE': 'SE',
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
    console.warn('Failed to detect country:', error);
  }

  return DEFAULT_COUNTRY;
}

/**
 * Get stored country from localStorage
 */
function getStoredCountry(): CountryCode | null {
  if (!browser) return null;

  try {
    return localStorage.getItem(STORAGE_KEY) as CountryCode | null;
  } catch {
    return null;
  }
}

/**
 * Store country to localStorage
 */
function storeCountry(code: CountryCode): void {
  if (!browser) return;

  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (error) {
    console.warn('Failed to store country:', error);
  }
}

// Initialize with stored country or detected country
const initialCountry = getStoredCountry() || detectCountry();

// Create the writable store
export const selectedCountry = writable<CountryCode>(initialCountry);

// Subscribe to changes and persist to localStorage
if (browser) {
  selectedCountry.subscribe((country) => {
    storeCountry(country);
  });
}

/**
 * Derived store for translation context
 * This combines all the data needed for translation
 */
export const translationContext = derived(selectedCountry, ($country) => {
  const countryData = getCountryByCode($country);

  if (!countryData) {
    // Fallback to US if country not found
    const fallbackData = getCountryByCode(DEFAULT_COUNTRY)!;
    return {
      country: DEFAULT_COUNTRY,
      countryData: fallbackData,
      names: getCountryNames(DEFAULT_COUNTRY),
      places: getCountryPlaces(DEFAULT_COUNTRY),
    } as TranslationContext;
  }

  return {
    country: $country,
    countryData,
    names: getCountryNames($country),
    places: getCountryPlaces($country),
  } as TranslationContext;
});
