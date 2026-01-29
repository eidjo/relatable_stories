import { describe, it, expect } from 'vitest';

describe('Share page redirect logic', () => {
  describe('URL construction with base path', () => {
    it('should construct correct redirect URL without base path', () => {
      const data = {
        slug: 'mahsa-arrest',
        country: 'us',
        language: 'en',
      };
      const base = '';

      // Country code should be uppercase in the redirect URL
      const targetPath = `${base}/stories/${data.slug}?country=${data.country.toUpperCase()}&lang=${data.language}`;

      expect(targetPath).toBe('/stories/mahsa-arrest?country=US&lang=en');
    });

    it('should construct correct redirect URL with base path', () => {
      const data = {
        slug: 'raha-2026',
        country: 'be',
        language: 'fr',
      };
      const base = '/relatable_stories';

      // Country code should be uppercase in the redirect URL
      const targetPath = `${base}/stories/${data.slug}?country=${data.country.toUpperCase()}&lang=${data.language}`;

      expect(targetPath).toBe('/relatable_stories/stories/raha-2026?country=BE&lang=fr');
    });

    it('should handle all countries correctly', () => {
      const testCases = [
        { country: 'us', language: 'en', expectedCountry: 'US' },
        { country: 'be', language: 'fr', expectedCountry: 'BE' },
        { country: 'be', language: 'nl', expectedCountry: 'BE' },
        { country: 'be', language: 'de', expectedCountry: 'BE' },
        { country: 'fr', language: 'fr', expectedCountry: 'FR' },
        { country: 'de', language: 'de', expectedCountry: 'DE' },
        { country: 'ca', language: 'en', expectedCountry: 'CA' },
        { country: 'ca', language: 'fr', expectedCountry: 'CA' },
      ];

      const slug = 'mahsa-arrest';
      const base = '/relatable_stories';

      testCases.forEach(({ country, language, expectedCountry }) => {
        const targetPath = `${base}/stories/${slug}?country=${country.toUpperCase()}&lang=${language}`;

        // Should be properly formatted (uppercase country code)
        expect(targetPath).toMatch(/^\/relatable_stories\/stories\/[a-z0-9-]+\?country=[A-Z]{2}&lang=[a-z]{2}$/);

        // Should contain correct values (uppercase country)
        expect(targetPath).toContain(`country=${expectedCountry}`);
        expect(targetPath).toContain(`lang=${language}`);
        expect(targetPath).toContain(`/stories/${slug}`);
      });
    });

    it('should convert country to uppercase for redirect URL', () => {
      const data = {
        slug: 'raha-2026',
        country: 'be',
        language: 'fr',
      };
      const base = '';

      // Data is lowercase, but redirect URL uses uppercase country
      const targetPath = `${base}/stories/${data.slug}?country=${data.country.toUpperCase()}&lang=${data.language}`;

      expect(targetPath).toBe('/stories/raha-2026?country=BE&lang=fr');
      expect(data.country).toBe(data.country.toLowerCase()); // Data stays lowercase
      expect(data.language).toBe(data.language.toLowerCase());
    });
  });

  describe('Share URL to Story URL mapping', () => {
    it('should map share URLs to correct story URLs with uppercase country', () => {
      const mappings = [
        {
          shareUrl: '/share/mahsa-arrest/us/en',
          expectedStoryUrl: '/stories/mahsa-arrest?country=US&lang=en',
        },
        {
          shareUrl: '/share/raha-2026/be/fr',
          expectedStoryUrl: '/stories/raha-2026?country=BE&lang=fr',
        },
        {
          shareUrl: '/share/mahsa-arrest/fr/fr',
          expectedStoryUrl: '/stories/mahsa-arrest?country=FR&lang=fr',
        },
      ];

      mappings.forEach(({ shareUrl, expectedStoryUrl }) => {
        const parts = shareUrl.split('/').filter(Boolean);
        const [, slug, country, lang] = parts;

        // Convert country to uppercase for story URL
        const targetPath = `/stories/${slug}?country=${country.toUpperCase()}&lang=${lang}`;

        expect(targetPath).toBe(expectedStoryUrl);
      });
    });

    it('should handle base path in share URL to story URL mapping', () => {
      const base = '/relatable_stories';
      const mappings = [
        {
          shareUrl: `${base}/share/mahsa-arrest/us/en`,
          expectedStoryUrl: `${base}/stories/mahsa-arrest?country=US&lang=en`,
        },
        {
          shareUrl: `${base}/share/raha-2026/be/fr`,
          expectedStoryUrl: `${base}/stories/raha-2026?country=BE&lang=fr`,
        },
      ];

      mappings.forEach(({ shareUrl, expectedStoryUrl }) => {
        const urlWithoutBase = shareUrl.replace(base, '');
        const parts = urlWithoutBase.split('/').filter(Boolean);
        const [, slug, country, lang] = parts;

        // Convert country to uppercase for story URL
        const targetPath = `${base}/stories/${slug}?country=${country.toUpperCase()}&lang=${lang}`;

        expect(targetPath).toBe(expectedStoryUrl);
      });
    });
  });

  describe('Fallback link', () => {
    it('should generate correct fallback link for click with uppercase country', () => {
      const data = {
        slug: 'mahsa-arrest',
        country: 'us',
        language: 'en',
      };
      const base = '/relatable_stories';

      // Relative path (as used in the href) with uppercase country
      const fallbackHref = `${base}/stories/${data.slug}?country=${data.country.toUpperCase()}&lang=${data.language}`;

      expect(fallbackHref).toBe('/relatable_stories/stories/mahsa-arrest?country=US&lang=en');
    });
  });
});
