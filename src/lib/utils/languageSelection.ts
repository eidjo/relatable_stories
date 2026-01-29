import { countryLanguages } from '$lib/data/contexts';
import type { CountryCode } from '$lib/types';
import type { LanguageCode } from '$lib/stores/language';

/**
 * Select the best language for a given country based on:
 * - English is always available (original story language)
 * - Current language if available in new country
 * - For Canada and other English-first countries: English first
 * - For other countries: First non-English language, or English as fallback
 *
 * @param countryCode - The country code to select language for
 * @param currentLanguage - The currently selected language (optional)
 * @returns Best language code for the country
 */
export function selectBestLanguageForCountry(
  countryCode: CountryCode,
  currentLanguage?: LanguageCode
): LanguageCode {
  const countryLangs = countryLanguages.countries[countryCode]?.languages || ['en'];

  // English is always available as the original story language
  // If current language is English, keep it
  if (currentLanguage === 'en') {
    return 'en';
  }

  // If current language is available in new country, keep it
  if (currentLanguage && countryLangs.includes(currentLanguage)) {
    return currentLanguage;
  }

  // Special handling for Canada: English is preferred
  if (countryCode === 'CA') {
    return 'en';
  }

  // For other countries: prefer first non-English language
  const nonEnglishLanguages = countryLangs.filter((lang) => lang !== 'en');
  if (nonEnglishLanguages.length > 0) {
    return nonEnglishLanguages[0] as LanguageCode;
  }

  // Fallback to English if only English available
  return 'en';
}

/**
 * Check if a language is available for a country
 * Note: English is always available as the original story language
 */
export function isLanguageAvailableForCountry(
  languageCode: LanguageCode,
  countryCode: CountryCode
): boolean {
  // English is always available as the original story language
  if (languageCode === 'en') {
    return true;
  }

  const countryLangs = countryLanguages.countries[countryCode]?.languages || ['en'];
  return countryLangs.includes(languageCode);
}
