import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CountryCode, TranslationContext } from '$lib/types';
import { getCountryByCode, getCountryNames, getCountryPlaces } from '$lib/data/contexts';
import { detectCountry, detectCountrySync } from '$lib/geolocation/detector';
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
