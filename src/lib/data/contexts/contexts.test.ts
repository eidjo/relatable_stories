import { describe, it, expect } from 'vitest';
import { countries } from '$lib/data/contexts';
import { getCountryNames, getCountryPlacesV2 } from '$lib/data/contexts';

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

describe('Places V2 YAML Validation', () => {
  it('should have places data for countries with V2 data', () => {
    // V2 places data is only available for some countries
    const v2Countries = ['US', 'UK', 'CZ'];

    v2Countries.forEach((countryCode) => {
      const places = getCountryPlacesV2(countryCode);
      expect(places).toBeDefined();
      expect(places.cities).toBeDefined();
      expect(Array.isArray(places.cities)).toBe(true);
    });
  });

  it('should have properly structured cities', () => {
    const v2Countries = ['US', 'UK', 'CZ'];

    v2Countries.forEach((countryCode) => {
      const places = getCountryPlacesV2(countryCode);

      places.cities.forEach((city) => {
        expect(city.id).toBeDefined();
        expect(typeof city.id).toBe('string');
        expect(city.name).toBeDefined();
        expect(typeof city.name).toBe('string');
        expect(city.size).toBeDefined();
        expect(['small', 'medium', 'large']).toContain(city.size);
        expect(typeof city.capital).toBe('boolean');
        expect(typeof city.population).toBe('number');
        expect(city.population).toBeGreaterThan(0);
      });
    });
  });

  it('should have protest locations for cities', () => {
    const v2Countries = ['US', 'UK', 'CZ'];

    v2Countries.forEach((countryCode) => {
      const places = getCountryPlacesV2(countryCode);

      places.cities.forEach((city) => {
        if (city.landmarks?.protest) {
          expect(Array.isArray(city.landmarks.protest)).toBe(true);
          expect(city.landmarks.protest.length).toBeGreaterThan(0);

          city.landmarks.protest.forEach((location) => {
            expect(typeof location).toBe('string');
            expect(location.length).toBeGreaterThan(0);
            expect(location.trim()).toBe(location);
          });
        }
      });
    });
  });

  // Generic fallbacks were removed - all places are now city-specific
});
