import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CountryCode } from '$lib/types';
import type { UITranslationContext } from '$lib/translation/translator';
import { getCountryByCode, getCountryNames, getCountryPlacesV2, getCountryComparableEvents } from '$lib/data/contexts';
import { selectedLanguage } from './language';
import { selectBestLanguageForCountry } from '$lib/utils/languageSelection';

const STORAGE_KEY = 'selected-country';
const DEFAULT_COUNTRY: CountryCode = 'US';

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

// Initialize with stored country or default
// Don't auto-detect here - let the modal handle detection on first visit
const initialCountry = getStoredCountry() || DEFAULT_COUNTRY;

// Create the writable store
export const selectedCountry = writable<CountryCode>(initialCountry);

// Subscribe to changes and persist to localStorage
if (browser) {
  selectedCountry.subscribe((country) => {
    storeCountry(country);

    // Auto-select best language for new country
    const currentLang = get(selectedLanguage);
    const bestLang = selectBestLanguageForCountry(country, currentLang);

    // Only update language if it changed
    if (bestLang !== currentLang) {
      selectedLanguage.set(bestLang);
    }
  });

  // Note: IP-based geolocation is now handled by LocationConfirmationModal
  // which shows on first visit to any story page
}

/**
 * Derived store for translation context (V2)
 * This combines all the data needed for translation with V2 marker system
 */
export const translationContext = derived(selectedCountry, ($country) => {
  const countryData = getCountryByCode($country);

  if (!countryData) {
    // Fallback to US if country not found
    const fallbackData = getCountryByCode(DEFAULT_COUNTRY)!;
    return {
      country: DEFAULT_COUNTRY,
      countryData: {
        population: fallbackData.population,
        'currency-symbol': fallbackData['currency-symbol'],
        'rial-to-local': fallbackData['rial-to-local'],
      },
      names: getCountryNames(DEFAULT_COUNTRY),
      places: getCountryPlacesV2(DEFAULT_COUNTRY),
      comparableEvents: getCountryComparableEvents(DEFAULT_COUNTRY),
    } as UITranslationContext;
  }

  return {
    country: $country,
    countryData: {
      population: countryData.population,
      'currency-symbol': countryData['currency-symbol'],
      'rial-to-local': countryData['rial-to-local'],
    },
    names: getCountryNames($country),
    places: getCountryPlacesV2($country),
    comparableEvents: getCountryComparableEvents($country),
  } as UITranslationContext;
});
