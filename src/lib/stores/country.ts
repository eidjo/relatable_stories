import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { CountryCode } from '$lib/types';
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
