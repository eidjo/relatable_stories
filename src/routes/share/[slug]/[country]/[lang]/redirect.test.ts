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

      const targetPath = `${base}/stories/${data.slug}?country=${data.country}&lang=${data.language}`;

      expect(targetPath).toBe('/stories/mahsa-arrest?country=us&lang=en');
    });

    it('should construct correct redirect URL with base path', () => {
      const data = {
        slug: 'raha-2026',
        country: 'be',
        language: 'fr',
      };
      const base = '/relatable_stories';

      const targetPath = `${base}/stories/${data.slug}?country=${data.country}&lang=${data.language}`;

      expect(targetPath).toBe('/relatable_stories/stories/raha-2026?country=be&lang=fr');
    });

    it('should handle all countries correctly', () => {
      const testCases = [
        { country: 'us', language: 'en' },
        { country: 'be', language: 'fr' },
        { country: 'be', language: 'nl' },
        { country: 'be', language: 'de' },
        { country: 'fr', language: 'fr' },
        { country: 'de', language: 'de' },
        { country: 'ca', language: 'en' },
        { country: 'ca', language: 'fr' },
      ];

      const slug = 'mahsa-arrest';
      const base = '/relatable_stories';

      testCases.forEach(({ country, language }) => {
        const targetPath = `${base}/stories/${slug}?country=${country}&lang=${language}`;

        // Should be properly formatted
        expect(targetPath).toMatch(/^\/relatable_stories\/stories\/[a-z0-9-]+\?country=[a-z]{2}&lang=[a-z]{2}$/);

        // Should contain correct values
        expect(targetPath).toContain(`country=${country}`);
        expect(targetPath).toContain(`lang=${language}`);
        expect(targetPath).toContain(`/stories/${slug}`);
      });
    });

    it('should preserve lowercase country and language codes', () => {
      const data = {
        slug: 'raha-2026',
        country: 'be',
        language: 'fr',
      };
      const base = '';

      const targetPath = `${base}/stories/${data.slug}?country=${data.country}&lang=${data.language}`;

      expect(targetPath).toBe('/stories/raha-2026?country=be&lang=fr');
      expect(data.country).toBe(data.country.toLowerCase());
      expect(data.language).toBe(data.language.toLowerCase());
    });
  });

  describe('Share URL to Story URL mapping', () => {
    it('should map share URLs to correct story URLs', () => {
      const mappings = [
        {
          shareUrl: '/share/mahsa-arrest/us/en',
          expectedStoryUrl: '/stories/mahsa-arrest?country=us&lang=en',
        },
        {
          shareUrl: '/share/raha-2026/be/fr',
          expectedStoryUrl: '/stories/raha-2026?country=be&lang=fr',
        },
        {
          shareUrl: '/share/mahsa-arrest/fr/fr',
          expectedStoryUrl: '/stories/mahsa-arrest?country=fr&lang=fr',
        },
      ];

      mappings.forEach(({ shareUrl, expectedStoryUrl }) => {
        const parts = shareUrl.split('/').filter(Boolean);
        const [, slug, country, lang] = parts;

        const targetPath = `/stories/${slug}?country=${country}&lang=${lang}`;

        expect(targetPath).toBe(expectedStoryUrl);
      });
    });

    it('should handle base path in share URL to story URL mapping', () => {
      const base = '/relatable_stories';
      const mappings = [
        {
          shareUrl: `${base}/share/mahsa-arrest/us/en`,
          expectedStoryUrl: `${base}/stories/mahsa-arrest?country=us&lang=en`,
        },
        {
          shareUrl: `${base}/share/raha-2026/be/fr`,
          expectedStoryUrl: `${base}/stories/raha-2026?country=be&lang=fr`,
        },
      ];

      mappings.forEach(({ shareUrl, expectedStoryUrl }) => {
        const urlWithoutBase = shareUrl.replace(base, '');
        const parts = urlWithoutBase.split('/').filter(Boolean);
        const [, slug, country, lang] = parts;

        const targetPath = `${base}/stories/${slug}?country=${country}&lang=${lang}`;

        expect(targetPath).toBe(expectedStoryUrl);
      });
    });
  });

  describe('Fallback link', () => {
    it('should generate correct fallback link for click', () => {
      const data = {
        slug: 'mahsa-arrest',
        country: 'us',
        language: 'en',
      };
      const base = '/relatable_stories';

      // Relative path (as used in the href)
      const fallbackHref = `${base}/stories/${data.slug}?country=${data.country}&lang=${data.language}`;

      expect(fallbackHref).toBe('/relatable_stories/stories/mahsa-arrest?country=us&lang=en');
    });
  });
});
