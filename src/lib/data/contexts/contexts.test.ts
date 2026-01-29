import { describe, it, expect } from 'vitest';
import { countries } from '$lib/data/contexts';
import { getCountryNames, getCountryPlaces } from '$lib/data/contexts';

describe('Countries YAML Validation', () => {
  it('should have at least one country', () => {
    expect(countries.length).toBeGreaterThan(0);
  });

  it('should have all required fields for each country', () => {
    countries.forEach((country) => {
      expect(country.code).toBeDefined();
      expect(country.code).toMatch(/^[A-Z]{2}$/); // Two letter code
      expect(country.name).toBeDefined();
      expect(typeof country.name).toBe('string');
      expect(country.name.length).toBeGreaterThan(0);
      expect(country.population).toBeDefined();
      expect(typeof country.population).toBe('number');
      expect(country.population).toBeGreaterThan(0);
      expect(country.currency).toBeDefined();
      expect(typeof country.currency).toBe('string');
      expect(country['currency-symbol']).toBeDefined();
      expect(typeof country['currency-symbol']).toBe('string');
      expect(country['rial-to-local']).toBeDefined();
      expect(typeof country['rial-to-local']).toBe('number');
      expect(country['rial-to-local']).toBeGreaterThan(0);
      expect(country.timezones).toBeDefined();
      expect(Array.isArray(country.timezones)).toBe(true);
      expect(country.timezones.length).toBeGreaterThan(0);
    });
  });

  it('should have unique country codes', () => {
    const codes = countries.map((c) => c.code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it('should have unique timezones across all countries', () => {
    const timezoneMap = new Map<string, string>();
    countries.forEach((country) => {
      country.timezones.forEach((tz) => {
        if (timezoneMap.has(tz)) {
          throw new Error(
            `Timezone ${tz} is mapped to both ${timezoneMap.get(tz)} and ${country.code}`
          );
        }
        timezoneMap.set(tz, country.code);
      });
    });
  });

  it('should have valid IANA timezone identifiers', () => {
    countries.forEach((country) => {
      country.timezones.forEach((tz) => {
        // Basic validation: timezones should be in format like "America/New_York" or "America/Indiana/Indianapolis"
        expect(tz).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$/);
      });
    });
  });

  it('should have Iran (IR) as the first country', () => {
    expect(countries[0].code).toBe('IR');
    expect(countries[0].name).toContain('Iran');
  });
});

describe('Names YAML Validation', () => {
  it('should have names for all countries', () => {
    countries.forEach((country) => {
      const names = getCountryNames(country.code);
      expect(names).toBeDefined();
      expect(names.male).toBeDefined();
      expect(Array.isArray(names.male)).toBe(true);
      expect(names.male.length).toBeGreaterThan(0);
      expect(names.female).toBeDefined();
      expect(Array.isArray(names.female)).toBe(true);
      expect(names.female.length).toBeGreaterThan(0);
      expect(names.neutral).toBeDefined();
      expect(Array.isArray(names.neutral)).toBe(true);
      expect(names.neutral.length).toBeGreaterThan(0);
    });
  });

  it('should have at least 5 names per gender per country', () => {
    countries.forEach((country) => {
      const names = getCountryNames(country.code);
      expect(names.male.length).toBeGreaterThanOrEqual(5);
      expect(names.female.length).toBeGreaterThanOrEqual(5);
      expect(names.neutral.length).toBeGreaterThanOrEqual(5);
    });
  });

  it('should have all names as non-empty strings', () => {
    countries.forEach((country) => {
      const names = getCountryNames(country.code);
      [...names.male, ...names.female, ...names.neutral].forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
        expect(name.trim()).toBe(name); // No leading/trailing whitespace
      });
    });
  });
});

describe('Places YAML Validation', () => {
  it('should have places for all countries', () => {
    countries.forEach((country) => {
      const places = getCountryPlaces(country.code);
      expect(places).toBeDefined();
    });
  });

  it('should have required place categories', () => {
    const requiredCategories = ['city-medium', 'landmark-protest', 'government-facility'];

    countries.forEach((country) => {
      const places = getCountryPlaces(country.code);
      requiredCategories.forEach((category) => {
        expect(places[category]).toBeDefined();
        expect(Array.isArray(places[category])).toBe(true);
        expect((places[category] as string[]).length).toBeGreaterThan(0);
      });
    });
  });

  it('should have all place names as non-empty strings', () => {
    countries.forEach((country) => {
      const places = getCountryPlaces(country.code);
      Object.values(places).forEach((placeList) => {
        if (Array.isArray(placeList)) {
          placeList.forEach((place) => {
            expect(typeof place).toBe('string');
            expect(place.length).toBeGreaterThan(0);
            expect(place.trim()).toBe(place); // No leading/trailing whitespace
          });
        }
      });
    });
  });
});
