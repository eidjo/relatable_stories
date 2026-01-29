import { describe, it, expect } from 'vitest';
import { selectBestLanguageForCountry, isLanguageAvailableForCountry } from './languageSelection';

describe('Language Selection', () => {
  describe('selectBestLanguageForCountry', () => {
    it('should keep English when switching between English-only countries', () => {
      // US → UK
      expect(selectBestLanguageForCountry('UK', 'en')).toBe('en');

      // UK → US
      expect(selectBestLanguageForCountry('US', 'en')).toBe('en');

      // US → Australia
      expect(selectBestLanguageForCountry('AU', 'en')).toBe('en');
    });

    it('should keep French when switching between countries that support French', () => {
      // France → Belgium
      expect(selectBestLanguageForCountry('BE', 'fr')).toBe('fr');

      // Belgium → Canada
      expect(selectBestLanguageForCountry('CA', 'fr')).toBe('fr');

      // Canada → France
      expect(selectBestLanguageForCountry('FR', 'fr')).toBe('fr');
    });

    it('should keep German when switching between countries that support German', () => {
      // Germany → Belgium
      expect(selectBestLanguageForCountry('BE', 'de')).toBe('de');

      // Belgium → Germany
      expect(selectBestLanguageForCountry('DE', 'de')).toBe('de');
    });

    it('should default to English for Canada when no current language', () => {
      expect(selectBestLanguageForCountry('CA')).toBe('en');
    });

    it('should prefer non-English language for non-Canada countries when no current language', () => {
      // France should default to French
      expect(selectBestLanguageForCountry('FR')).toBe('fr');

      // Germany should default to German
      expect(selectBestLanguageForCountry('DE')).toBe('de');

      // Belgium should default to French (first non-English)
      expect(selectBestLanguageForCountry('BE')).toBe('fr');
    });

    it('should switch to best available language when current is not supported', () => {
      // French from France → US (only English)
      expect(selectBestLanguageForCountry('US', 'fr')).toBe('en');

      // German from Germany → France (French, no German)
      expect(selectBestLanguageForCountry('FR', 'de')).toBe('fr');

      // Czech from Czech Republic → UK (only English)
      expect(selectBestLanguageForCountry('UK', 'cs')).toBe('en');
    });

    it('should handle Canada special case correctly', () => {
      // English from US → Canada (keeps English)
      expect(selectBestLanguageForCountry('CA', 'en')).toBe('en');

      // French from France → Canada (keeps French)
      expect(selectBestLanguageForCountry('CA', 'fr')).toBe('fr');

      // German from Germany → Canada (switches to English, not French)
      expect(selectBestLanguageForCountry('CA', 'de')).toBe('en');

      // No current language → Canada (defaults to English)
      expect(selectBestLanguageForCountry('CA')).toBe('en');
    });

    it('should keep English when available even for non-English-primary countries', () => {
      // English is available in Belgium
      expect(selectBestLanguageForCountry('BE', 'en')).toBe('en');

      // But if no current language, Belgium defaults to French (first non-English)
      expect(selectBestLanguageForCountry('BE')).toBe('fr');
    });

    it('should handle Iran correctly', () => {
      // Iran has Farsi and English
      // No current language → defaults to Farsi (first non-English)
      expect(selectBestLanguageForCountry('IR')).toBe('fa');

      // Farsi → Iran (keeps Farsi)
      expect(selectBestLanguageForCountry('IR', 'fa')).toBe('fa');

      // English → Iran (keeps English)
      expect(selectBestLanguageForCountry('IR', 'en')).toBe('en');
    });
  });

  describe('isLanguageAvailableForCountry', () => {
    it('should correctly identify available languages', () => {
      // English available everywhere
      expect(isLanguageAvailableForCountry('en', 'US')).toBe(true);
      expect(isLanguageAvailableForCountry('en', 'FR')).toBe(true);

      // French available in France, Belgium, Canada
      expect(isLanguageAvailableForCountry('fr', 'FR')).toBe(true);
      expect(isLanguageAvailableForCountry('fr', 'BE')).toBe(true);
      expect(isLanguageAvailableForCountry('fr', 'CA')).toBe(true);
      expect(isLanguageAvailableForCountry('fr', 'US')).toBe(false);

      // German available in Germany, Belgium
      expect(isLanguageAvailableForCountry('de', 'DE')).toBe(true);
      expect(isLanguageAvailableForCountry('de', 'BE')).toBe(true);
      expect(isLanguageAvailableForCountry('de', 'FR')).toBe(false);
    });
  });
});
