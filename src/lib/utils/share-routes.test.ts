import { describe, it, expect } from 'vitest';
import { getAllShareRoutes, getShareRouteEntries } from './share-routes';

describe('share-routes', () => {
  describe('getAllShareRoutes', () => {
    it('should generate routes for all story × country × language combinations', () => {
      const routes = getAllShareRoutes();

      // Should have routes (2 stories × multiple countries/languages)
      expect(routes.length).toBeGreaterThan(0);

      // Each route should have required fields
      routes.forEach((route) => {
        expect(route).toHaveProperty('slug');
        expect(route).toHaveProperty('country');
        expect(route).toHaveProperty('language');
        expect(typeof route.slug).toBe('string');
        expect(typeof route.country).toBe('string');
        expect(typeof route.language).toBe('string');
      });
    });

    it('should generate routes for known stories', () => {
      const routes = getAllShareRoutes();
      const slugs = routes.map((r) => r.slug);

      expect(slugs).toContain('mahsa-arrest');
      expect(slugs).toContain('raha-2026');
    });

    it('should generate routes for known countries', () => {
      const routes = getAllShareRoutes();
      const countries = new Set(routes.map((r) => r.country));

      // Check for some known countries (lowercase)
      expect(countries.has('us')).toBe(true);
      expect(countries.has('fr')).toBe(true);
      expect(countries.has('be')).toBe(true);
      expect(countries.has('de')).toBe(true);
    });

    it('should generate routes with appropriate languages for each country', () => {
      const routes = getAllShareRoutes();

      // Belgium should have multiple languages including English
      const belgiumRoutes = routes.filter((r) => r.country === 'be');
      const belgiumLanguages = new Set(belgiumRoutes.map((r) => r.language));
      expect(belgiumLanguages.size).toBeGreaterThan(1); // BE has fr, nl, de, en
      expect(belgiumLanguages.has('fr')).toBe(true);
      expect(belgiumLanguages.has('en')).toBe(true); // English always available

      // US should have English
      const usRoutes = routes.filter((r) => r.country === 'us');
      const usLanguages = new Set(usRoutes.map((r) => r.language));
      expect(usLanguages.has('en')).toBe(true);

      // France should have French AND English (to read with French context)
      const frRoutes = routes.filter((r) => r.country === 'fr');
      const frLanguages = new Set(frRoutes.map((r) => r.language));
      expect(frLanguages.has('fr')).toBe(true);
      expect(frLanguages.has('en')).toBe(true); // English always available
    });

    it('should use lowercase for country and language codes', () => {
      const routes = getAllShareRoutes();

      routes.forEach((route) => {
        expect(route.country).toBe(route.country.toLowerCase());
        expect(route.language).toBe(route.language.toLowerCase());
      });
    });

    it('should include English for every country', () => {
      const routes = getAllShareRoutes();
      const countriesWithEnglish = new Set(
        routes.filter((r) => r.language === 'en').map((r) => r.country)
      );

      // Get all unique countries from routes
      const allCountries = new Set(routes.map((r) => r.country));

      // Every country should have English available
      allCountries.forEach((country) => {
        expect(countriesWithEnglish.has(country)).toBe(true);
      });
    });
  });

  describe('getShareRouteEntries', () => {
    it('should generate valid URL paths', () => {
      const entries = getShareRouteEntries();

      expect(entries.length).toBeGreaterThan(0);

      entries.forEach((entry) => {
        expect(entry).toMatch(/^\/share\/[a-z0-9-]+\/[a-z]{2}\/[a-z]{2}$/);
      });
    });

    it('should generate expected URL format', () => {
      const entries = getShareRouteEntries();

      // Check for known combinations
      expect(entries).toContain('/share/mahsa-arrest/us/en');
      expect(entries).toContain('/share/raha-2026/fr/fr');
      expect(entries).toContain('/share/mahsa-arrest/be/fr');
    });

    it('should handle base path correctly', () => {
      const entries = getShareRouteEntries();

      // URLs should start with /share/ (no base path in the entries themselves)
      entries.forEach((entry) => {
        expect(entry.startsWith('/share/')).toBe(true);
      });
    });
  });

  describe('redirect URL construction', () => {
    it('should construct correct redirect URLs with base path', () => {
      const testCases = [
        {
          slug: 'mahsa-arrest',
          country: 'us',
          language: 'en',
          base: '',
          expected: '/stories/mahsa-arrest?country=us&lang=en',
        },
        {
          slug: 'raha-2026',
          country: 'be',
          language: 'fr',
          base: '',
          expected: '/stories/raha-2026?country=be&lang=fr',
        },
        {
          slug: 'mahsa-arrest',
          country: 'us',
          language: 'en',
          base: '/relatable_stories',
          expected: '/relatable_stories/stories/mahsa-arrest?country=us&lang=en',
        },
        {
          slug: 'raha-2026',
          country: 'fr',
          language: 'fr',
          base: '/relatable_stories',
          expected: '/relatable_stories/stories/raha-2026?country=fr&lang=fr',
        },
      ];

      testCases.forEach(({ slug, country, language, base, expected }) => {
        const targetPath = `${base}/stories/${slug}?country=${country}&lang=${language}`;
        expect(targetPath).toBe(expected);
      });
    });
  });
});
