import { describe, it, expect } from 'vitest';
import { stories } from '$lib/data/stories';
import { countries } from '$lib/data/contexts';
import { translateStory } from '$lib/translation/translator';
import { getCountryByCode, getCountryNames, getCountryPlaces } from '$lib/data/contexts';

describe('Stories Data Validation', () => {
  it('should have at least one story', () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  it('should have all required fields for each story', () => {
    stories.forEach((story) => {
      // Basic metadata
      expect(story.id).toBeDefined();
      expect(typeof story.id).toBe('string');
      expect(story.slug).toBeDefined();
      expect(typeof story.slug).toBe('string');
      expect(story.slug).toMatch(/^[a-z0-9-]+$/); // URL-safe slug
      expect(story.title).toBeDefined();
      expect(typeof story.title).toBe('string');
      expect(story.date).toBeDefined();
      expect(typeof story.date).toBe('string');
      expect(story.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      expect(story.summary).toBeDefined();
      expect(typeof story.summary).toBe('string');
      expect(story.content).toBeDefined();
      expect(typeof story.content).toBe('string');
      expect(story.content.length).toBeGreaterThan(0);

      // Classification
      expect(story.tags).toBeDefined();
      expect(Array.isArray(story.tags)).toBe(true);
      expect(story.tags.length).toBeGreaterThan(0);
      expect(story.severity).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(story.severity);
      expect(typeof story.verified).toBe('boolean');

      // Optional fields
      if (story.image) {
        expect(typeof story.image).toBe('string');
      }
      if (story.source) {
        expect(typeof story.source).toBe('string');
      }
    });
  });

  it('should have unique story IDs', () => {
    const ids = stories.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have unique story slugs', () => {
    const slugs = stories.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  it('should have valid dates', () => {
    stories.forEach((story) => {
      const date = new Date(story.date);
      expect(date.toString()).not.toBe('Invalid Date');
      // Dates should be between 2020 and 2030 (reasonable range for Iran uprising)
      expect(date.getFullYear()).toBeGreaterThanOrEqual(2020);
      expect(date.getFullYear()).toBeLessThanOrEqual(2030);
    });
  });
});

describe('Story Translation Validation', () => {
  it('should successfully translate all stories for all countries', () => {
    countries.forEach((country) => {
      const countryData = getCountryByCode(country.code);
      expect(countryData).toBeDefined();

      const translationContext = {
        country: country.code,
        countryData: countryData!,
        names: getCountryNames(country.code),
        places: getCountryPlaces(country.code),
      };

      stories.forEach((story) => {
        // Should not throw
        const translated = translateStory(story, translationContext);

        // Translated story should have required fields
        expect(translated.id).toBe(story.id);
        expect(translated.slug).toBe(story.slug);
        expect(translated.title).toBeDefined();
        expect(Array.isArray(translated.title)).toBe(true);
        expect(translated.title.length).toBeGreaterThan(0);
        expect(translated.summary).toBeDefined();
        expect(Array.isArray(translated.summary)).toBe(true);
        expect(translated.summary.length).toBeGreaterThan(0);
        expect(translated.content).toBeDefined();
        expect(Array.isArray(translated.content)).toBe(true);
        expect(translated.content.length).toBeGreaterThan(0);

        // All segments should have required properties
        [...translated.title, ...translated.summary, ...translated.content].forEach((segment) => {
          expect(segment.text).toBeDefined();
          expect(typeof segment.text).toBe('string');
          expect(segment.type).toBeDefined();
          // Original can be string or object (for complex types like currency)
          // or null for text segments
        });
      });
    });
  });

  it('should detect and translate markers in story content', () => {
    const iranContext = {
      country: 'IR' as const,
      countryData: getCountryByCode('IR')!,
      names: getCountryNames('IR'),
      places: getCountryPlaces('IR'),
    };

    // Find a story with markers
    const storyWithMarkers = stories.find((s) => s.content.includes('{{'));
    if (storyWithMarkers) {
      const translated = translateStory(storyWithMarkers, iranContext);

      // Should have some translated segments (not all text)
      const hasTranslatedSegments = [
        ...translated.title,
        ...translated.summary,
        ...translated.content,
      ].some((seg) => seg.type !== 'text');

      expect(hasTranslatedSegments).toBe(true);
    }
  });

  it('should preserve original values for all translated segments', () => {
    const usContext = {
      country: 'US' as const,
      countryData: getCountryByCode('US')!,
      names: getCountryNames('US'),
      places: getCountryPlaces('US'),
    };

    stories.forEach((story) => {
      const translated = translateStory(story, usContext);

      [...translated.title, ...translated.summary, ...translated.content].forEach((segment) => {
        if (segment.type !== 'text' && segment.type !== 'paragraph-break' && segment.type !== 'source') {
          // Translated segments should have original value (except sources which are added, not translated)
          expect(segment.original).toBeDefined();
        }
      });
    });
  });

  it('should translate to different values for different countries', () => {
    const storyWithMarkers = stories.find((s) => s.content.includes('{{'));
    if (!storyWithMarkers) {
      // Skip if no stories have markers
      return;
    }

    const usContext = {
      country: 'US' as const,
      countryData: getCountryByCode('US')!,
      names: getCountryNames('US'),
      places: getCountryPlaces('US'),
    };

    const ukContext = {
      country: 'UK' as const,
      countryData: getCountryByCode('UK')!,
      names: getCountryNames('UK'),
      places: getCountryPlaces('UK'),
    };

    const usTranslated = translateStory(storyWithMarkers, usContext);
    const ukTranslated = translateStory(storyWithMarkers, ukContext);

    // Titles might differ
    const usTitle = usTranslated.title.map((s) => s.text).join('');
    const ukTitle = ukTranslated.title.map((s) => s.text).join('');

    // Content should have some differences (at least for place names)
    const usContent = usTranslated.content.map((s) => s.text).join('');
    const ukContent = ukTranslated.content.map((s) => s.text).join('');

    // At least one should differ
    expect(usTitle !== ukTitle || usContent !== ukContent).toBe(true);
  });
});

describe('Story Marker Validation', () => {
  it('should have properly formatted markers', () => {
    stories.forEach((story) => {
      const allText = [story.title, story.summary, story.content].join(' ');
      const markers = allText.match(/\{\{[^}]+\}\}/g) || [];

      markers.forEach((marker) => {
        // Should be in format {{type:key}}
        expect(marker).toMatch(/^\{\{[a-z-]+:[a-z0-9-]+\}\}$/);

        // Extract type and key
        const match = marker.match(/^\{\{([a-z-]+):([a-z0-9-]+)\}\}$/);
        expect(match).not.toBeNull();
        if (match) {
          const [, type, key] = match;
          // Valid types
          expect([
            'name',
            'place',
            'date',
            'number',
            'currency',
            'event',
            'time',
            'source',
            'occupation',
            'image',
          ]).toContain(type);
          // Key should not be empty
          expect(key.length).toBeGreaterThan(0);
        }
      });
    });
  });

  it('should not have unmatched braces', () => {
    stories.forEach((story) => {
      const allText = [story.title, story.summary, story.content].join(' ');

      // Count opening and closing braces
      const openCount = (allText.match(/\{\{/g) || []).length;
      const closeCount = (allText.match(/\}\}/g) || []).length;

      expect(openCount).toBe(closeCount);
    });
  });
});
