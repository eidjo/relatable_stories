/**
 * Unit tests to verify that all countries defined in countries.yaml
 * have complete configuration in all required files
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import type { Country } from '$lib/types';

const DATA_DIR = join(process.cwd(), 'src/lib/data/contexts');

// Load all configuration files
const countriesData = load(readFileSync(join(DATA_DIR, 'countries.yaml'), 'utf-8')) as {
  countries: Country[];
};
const countryLanguagesData = load(readFileSync(join(DATA_DIR, 'country-languages.yaml'), 'utf-8')) as {
  countries: Record<string, { languages: string[] }>;
  language_names: Record<string, string>;
};
const namesData = load(readFileSync(join(DATA_DIR, 'names.yaml'), 'utf-8')) as Record<
  string,
  { female: string[]; male: string[]; neutral: string[] }
>;
const placesData = load(readFileSync(join(DATA_DIR, 'places.yaml'), 'utf-8')) as Record<
  string,
  Record<string, string[]>
>;

const countries = countriesData.countries;
const countryCodes = countries.map((c) => c.code);

describe('Country Configuration Validation', () => {
  describe('countries.yaml', () => {
    it('should have at least one country defined', () => {
      expect(countries.length).toBeGreaterThan(0);
    });

    it('should have unique country codes', () => {
      const codes = countries.map((c) => c.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should have all required fields for each country', () => {
      countries.forEach((country) => {
        expect(country).toHaveProperty('code');
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('population');
        expect(country).toHaveProperty('currency');
        expect(country).toHaveProperty('currency-symbol');
        expect(country).toHaveProperty('rial-to-local');
        expect(country).toHaveProperty('timezones');

        // Validate types
        expect(typeof country.code).toBe('string');
        expect(typeof country.name).toBe('string');
        expect(typeof country['population']).toBe('number');
        expect(typeof country['currency']).toBe('string');
        expect(typeof country['currency-symbol']).toBe('string');
        expect(typeof country['rial-to-local']).toBe('number');
        expect(Array.isArray(country['timezones'])).toBe(true);
        expect(country['timezones'].length).toBeGreaterThan(0);
      });
    });
  });

  describe('country-languages.yaml', () => {
    it('should have language definitions for all countries', () => {
      const missingCountries: string[] = [];

      countryCodes.forEach((code) => {
        if (!countryLanguagesData.countries[code]) {
          missingCountries.push(code);
        }
      });

      if (missingCountries.length > 0) {
        throw new Error(
          `Missing language definitions for countries: ${missingCountries.join(', ')}\n` +
            `Add them to src/lib/data/contexts/country-languages.yaml`
        );
      }

      expect(missingCountries).toHaveLength(0);
    });

    it('should have at least one language for each country', () => {
      const countriesWithNoLanguages: string[] = [];

      countryCodes.forEach((code) => {
        const languages = countryLanguagesData.countries[code]?.languages || [];
        if (languages.length === 0) {
          countriesWithNoLanguages.push(code);
        }
      });

      if (countriesWithNoLanguages.length > 0) {
        throw new Error(
          `Countries with no languages defined: ${countriesWithNoLanguages.join(', ')}\n` +
            `Add language definitions in src/lib/data/contexts/country-languages.yaml`
        );
      }

      expect(countriesWithNoLanguages).toHaveLength(0);
    });

    it('should have display names for all referenced languages', () => {
      const allLanguages = new Set<string>();
      const missingLanguageNames: string[] = [];

      // Collect all languages used across all countries
      Object.values(countryLanguagesData.countries).forEach((countryConfig) => {
        countryConfig.languages.forEach((lang) => allLanguages.add(lang));
      });

      // Check each language has a display name
      allLanguages.forEach((lang) => {
        if (!countryLanguagesData.language_names[lang]) {
          missingLanguageNames.push(lang);
        }
      });

      if (missingLanguageNames.length > 0) {
        throw new Error(
          `Missing language display names for: ${missingLanguageNames.join(', ')}\n` +
            `Add them to the language_names section in src/lib/data/contexts/country-languages.yaml`
        );
      }

      expect(missingLanguageNames).toHaveLength(0);
    });
  });

  describe('names.yaml', () => {
    it('should have name mappings for all countries', () => {
      const missingCountries: string[] = [];

      countryCodes.forEach((code) => {
        if (!namesData[code]) {
          missingCountries.push(code);
        }
      });

      if (missingCountries.length > 0) {
        throw new Error(
          `Missing name mappings for countries: ${missingCountries.join(', ')}\n` +
            `Add them to src/lib/data/contexts/names.yaml`
        );
      }

      expect(missingCountries).toHaveLength(0);
    });

    it('should have female, male, and neutral name lists for each country', () => {
      const issues: string[] = [];

      countryCodes.forEach((code) => {
        const names = namesData[code];
        if (!names) return; // Already caught by previous test

        if (!names.female || !Array.isArray(names.female) || names.female.length === 0) {
          issues.push(`${code}: missing or empty female names`);
        }

        if (!names.male || !Array.isArray(names.male) || names.male.length === 0) {
          issues.push(`${code}: missing or empty male names`);
        }

        if (!names.neutral || !Array.isArray(names.neutral) || names.neutral.length === 0) {
          issues.push(`${code}: missing or empty neutral names`);
        }
      });

      if (issues.length > 0) {
        throw new Error(
          `Name list issues:\n${issues.join('\n')}\n` +
            `Fix in src/lib/data/contexts/names.yaml`
        );
      }

      expect(issues).toHaveLength(0);
    });

    it('should have at least 5 names in each list', () => {
      const issues: string[] = [];

      countryCodes.forEach((code) => {
        const names = namesData[code];
        if (!names) return;

        if (names.female && names.female.length < 5) {
          issues.push(`${code}: only ${names.female.length} female names (recommend at least 5)`);
        }

        if (names.male && names.male.length < 5) {
          issues.push(`${code}: only ${names.male.length} male names (recommend at least 5)`);
        }

        if (names.neutral && names.neutral.length < 5) {
          issues.push(`${code}: only ${names.neutral.length} neutral names (recommend at least 5)`);
        }
      });

      if (issues.length > 0) {
        throw new Error(
          `Insufficient name variety:\n${issues.join('\n')}\n` +
            `Add more names in src/lib/data/contexts/names.yaml`
        );
      }

      expect(issues).toHaveLength(0);
    });
  });

  describe('places.yaml', () => {
    const requiredPlaceCategories = [
      'city-small',
      'city-medium',
      'city-large',
      'landmark-protest',
      'government-facility',
      'university',
    ];

    it('should have place mappings for all countries', () => {
      const missingCountries: string[] = [];

      countryCodes.forEach((code) => {
        if (!placesData[code]) {
          missingCountries.push(code);
        }
      });

      if (missingCountries.length > 0) {
        throw new Error(
          `Missing place mappings for countries: ${missingCountries.join(', ')}\n` +
            `Add them to src/lib/data/contexts/places.yaml`
        );
      }

      expect(missingCountries).toHaveLength(0);
    });

    it('should have all required place categories for each country', () => {
      const issues: string[] = [];

      countryCodes.forEach((code) => {
        const places = placesData[code];
        if (!places) return; // Already caught by previous test

        requiredPlaceCategories.forEach((category) => {
          if (!places[category]) {
            issues.push(`${code}: missing category "${category}"`);
          } else if (!Array.isArray(places[category]) || places[category].length === 0) {
            issues.push(`${code}: category "${category}" is empty`);
          }
        });
      });

      if (issues.length > 0) {
        throw new Error(
          `Place category issues:\n${issues.join('\n')}\n` +
            `Fix in src/lib/data/contexts/places.yaml\n` +
            `Required categories: ${requiredPlaceCategories.join(', ')}`
        );
      }

      expect(issues).toHaveLength(0);
    });

    it('should have at least 3 places in each category', () => {
      const issues: string[] = [];

      countryCodes.forEach((code) => {
        const places = placesData[code];
        if (!places) return;

        requiredPlaceCategories.forEach((category) => {
          const placeList = places[category];
          if (placeList && placeList.length < 3) {
            issues.push(
              `${code}: only ${placeList.length} places in "${category}" (recommend at least 3)`
            );
          }
        });
      });

      if (issues.length > 0) {
        throw new Error(
          `Insufficient place variety:\n${issues.join('\n')}\n` +
            `Add more places in src/lib/data/contexts/places.yaml`
        );
      }

      expect(issues).toHaveLength(0);
    });
  });

  describe('Cross-file consistency', () => {
    it('should have matching country codes across all files', () => {
      const languageCodes = Object.keys(countryLanguagesData.countries);
      const nameCodes = Object.keys(namesData);
      const placeCodes = Object.keys(placesData);

      const allCodes = new Set([...countryCodes, ...languageCodes, ...nameCodes, ...placeCodes]);
      const issues: string[] = [];

      allCodes.forEach((code) => {
        const inCountries = countryCodes.includes(code);
        const inLanguages = languageCodes.includes(code);
        const inNames = nameCodes.includes(code);
        const inPlaces = placeCodes.includes(code);

        if (inCountries && (!inLanguages || !inNames || !inPlaces)) {
          const missing = [
            !inLanguages && 'country-languages.yaml',
            !inNames && 'names.yaml',
            !inPlaces && 'places.yaml',
          ]
            .filter(Boolean)
            .join(', ');
          issues.push(`${code}: exists in countries.yaml but missing in ${missing}`);
        }

        if (!inCountries && (inLanguages || inNames || inPlaces)) {
          const present = [
            inLanguages && 'country-languages.yaml',
            inNames && 'names.yaml',
            inPlaces && 'places.yaml',
          ]
            .filter(Boolean)
            .join(', ');
          issues.push(`${code}: exists in ${present} but missing in countries.yaml`);
        }
      });

      if (issues.length > 0) {
        throw new Error(`Country code inconsistencies:\n${issues.join('\n')}`);
      }

      expect(issues).toHaveLength(0);
    });
  });
});
