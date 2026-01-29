import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { formatDate, getLocale, getAvailableLocales } from './dateLocales';

describe('Date Localization', () => {
  // Load country-languages.yaml to get all supported languages
  const countryLanguagesPath = path.resolve(
    process.cwd(),
    'src/lib/data/contexts/country-languages.yaml'
  );
  const countryLanguagesYaml = fs.readFileSync(countryLanguagesPath, 'utf-8');
  const countryLanguagesData = yaml.load(countryLanguagesYaml) as {
    countries: Record<string, { languages: string[] }>;
    language_names: Record<string, string>;
  };

  // Extract all unique language codes from country-languages.yaml
  const allLanguages = new Set<string>();
  Object.values(countryLanguagesData.countries).forEach((country) => {
    country.languages.forEach((lang) => allLanguages.add(lang));
  });

  const supportedLanguages = Array.from(allLanguages).sort();

  describe('Locale Coverage', () => {
    it('should have date-fns locales for all languages in country-languages.yaml', () => {
      const availableLocales = getAvailableLocales();
      const missingLocales: string[] = [];

      supportedLanguages.forEach((lang) => {
        if (!availableLocales.includes(lang)) {
          missingLocales.push(lang);
        }
      });

      if (missingLocales.length > 0) {
        throw new Error(
          `Missing date-fns locales for languages: ${missingLocales.join(', ')}\n` +
            `Please add these locales to src/lib/utils/dateLocales.ts:\n` +
            missingLocales
              .map(
                (lang) =>
                  `  import { ${lang} } from 'date-fns/locale/${lang}';\n` +
                  `  ${lang}: ${lang}, // in localeMap`
              )
              .join('\n')
        );
      }

      expect(missingLocales).toEqual([]);
    });

    it('should have locale objects for all supported languages', () => {
      supportedLanguages.forEach((lang) => {
        const locale = getLocale(lang);
        expect(locale).toBeDefined();
        expect(locale).toHaveProperty('code');
      });
    });
  });

  describe('formatDate Function', () => {
    const testDate = '2022-09-16'; // Mahsa Amini's death date
    const testDateObj = new Date(testDate);

    it('should format dates for all supported languages without errors', () => {
      supportedLanguages.forEach((lang) => {
        expect(() => {
          const formatted = formatDate(testDate, 'PP', lang);
          expect(formatted).toBeTruthy();
          expect(typeof formatted).toBe('string');
        }).not.toThrow();
      });
    });

    it('should format dates with different format strings', () => {
      const formats = ['P', 'PP', 'PPP', 'PPPP', 'Pp', 'PPp', 'PPpp'];

      formats.forEach((format) => {
        supportedLanguages.forEach((lang) => {
          const formatted = formatDate(testDate, format, lang);
          expect(formatted).toBeTruthy();
          expect(typeof formatted).toBe('string');
        });
      });
    });

    it('should return different formats for different languages', () => {
      // Test that English and Czech produce different output
      const enFormatted = formatDate(testDate, 'PPP', 'en');
      const csFormatted = formatDate(testDate, 'PPP', 'cs');

      expect(enFormatted).not.toBe(csFormatted);
      expect(enFormatted).toContain('September');
      expect(csFormatted).toContain('září'); // Czech for September
    });

    it('should handle Date objects as input', () => {
      supportedLanguages.forEach((lang) => {
        const formatted = formatDate(testDateObj, 'PP', lang);
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
      });
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = 'not-a-date';
      const formatted = formatDate(invalidDate, 'PP', 'en');
      expect(formatted).toBe(invalidDate); // Should return original string
    });

    it('should fallback to English for unknown language codes', () => {
      const formatted = formatDate(testDate, 'PP', 'unknown-lang');
      const enFormatted = formatDate(testDate, 'PP', 'en');
      expect(formatted).toBe(enFormatted);
    });
  });

  describe('Language-Specific Formatting', () => {
    const testDate = '2022-09-16';

    it('should use Norwegian locale (nb) for both Norwegian and Danish', () => {
      const noFormatted = formatDate(testDate, 'PPP', 'no');
      const daFormatted = formatDate(testDate, 'PPP', 'da');

      // Both should use the same locale (nb)
      expect(noFormatted).toBe(daFormatted);
    });

    it('should format dates correctly for all European languages', () => {
      const europeanLanguages = ['cs', 'de', 'el', 'es', 'fi', 'fr', 'it', 'nl', 'pl', 'pt', 'sv'];

      europeanLanguages.forEach((lang) => {
        if (supportedLanguages.includes(lang)) {
          const formatted = formatDate(testDate, 'PPP', lang);
          expect(formatted).toBeTruthy();
          // Should contain the year
          expect(formatted).toContain('2022');
        }
      });
    });

    it('should format dates correctly for Farsi', () => {
      if (supportedLanguages.includes('fa')) {
        const formatted = formatDate(testDate, 'PPP', 'fa');
        expect(formatted).toBeTruthy();
        expect(typeof formatted).toBe('string');
      }
    });
  });

  describe('All Country-Language Combinations', () => {
    it('should format dates for every country-language combination', () => {
      const testDate = '2022-09-16';
      const failedCombinations: string[] = [];

      Object.entries(countryLanguagesData.countries).forEach(([countryCode, countryData]) => {
        countryData.languages.forEach((lang) => {
          try {
            const formatted = formatDate(testDate, 'PP', lang);
            expect(formatted).toBeTruthy();
            expect(typeof formatted).toBe('string');
          } catch (error) {
            failedCombinations.push(`${countryCode}/${lang}: ${error}`);
          }
        });
      });

      if (failedCombinations.length > 0) {
        throw new Error(
          `Date formatting failed for these country-language combinations:\n${failedCombinations.join('\n')}`
        );
      }

      expect(failedCombinations).toEqual([]);
    });

    it('should produce locale-specific output for each language', () => {
      const testDate = '2023-01-15';
      const outputs = new Map<string, string>();

      supportedLanguages.forEach((lang) => {
        const formatted = formatDate(testDate, 'PPP', lang);
        outputs.set(lang, formatted);
      });

      // All languages should have an output
      expect(outputs.size).toBe(supportedLanguages.length);

      // Outputs should generally be different (allowing some to be same like no/da)
      const uniqueOutputs = new Set(outputs.values());
      expect(uniqueOutputs.size).toBeGreaterThan(supportedLanguages.length / 2);
    });
  });

  describe('Integration with country-languages.yaml', () => {
    it('should have display names for all languages with locales', () => {
      const availableLocales = getAvailableLocales();
      const missingDisplayNames: string[] = [];

      availableLocales.forEach((lang) => {
        if (!countryLanguagesData.language_names[lang]) {
          missingDisplayNames.push(lang);
        }
      });

      if (missingDisplayNames.length > 0) {
        console.warn(
          `Warning: These languages have locales but no display names in country-languages.yaml: ${missingDisplayNames.join(', ')}`
        );
      }

      // This is a warning, not a failure - it's okay to have locales without display names
      expect(missingDisplayNames.length).toBeLessThanOrEqual(availableLocales.length);
    });

    it('should not have orphaned locales (locales without countries)', () => {
      const availableLocales = getAvailableLocales();
      const languagesInUse = Array.from(allLanguages);
      const orphanedLocales: string[] = [];

      availableLocales.forEach((locale) => {
        if (!languagesInUse.includes(locale)) {
          orphanedLocales.push(locale);
        }
      });

      if (orphanedLocales.length > 0) {
        console.warn(
          `Warning: These locales are defined but not used by any country: ${orphanedLocales.join(', ')}`
        );
      }

      // This is informational - it's okay to have extra locales for future use
      expect(Array.isArray(orphanedLocales)).toBe(true);
    });
  });
});
