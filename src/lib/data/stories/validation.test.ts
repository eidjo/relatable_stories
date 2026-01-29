import { describe, it, expect } from 'vitest';
import { stories } from '$lib/data/stories';
import { translateStory } from '$lib/translation/pipeline';
import { getCountryByCode } from '$lib/data/contexts';

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

describe('Story Data Loading', () => {
  it('should retrieve story by slug', () => {
    const firstStory = stories[0];
    const found = stories.find((s) => s.slug === firstStory.slug);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstStory.id);
  });

  it('should retrieve story by id', () => {
    const firstStory = stories[0];
    const found = stories.find((s) => s.id === firstStory.id);
    expect(found).toBeDefined();
    expect(found?.slug).toBe(firstStory.slug);
  });

  it('should return undefined for non-existent slug', () => {
    const found = stories.find((s) => s.slug === 'non-existent-story-slug-12345');
    expect(found).toBeUndefined();
  });

  it('should have valid severity levels', () => {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    stories.forEach((story) => {
      expect(validSeverities).toContain(story.severity);
    });
  });

  it('should have valid marker types', () => {
    stories.forEach((story) => {
      if (!story.markers) return;

      Object.values(story.markers).forEach((marker) => {
        // V2 markers are identified by their fields, not by a 'type' field
        // Check that marker is an object
        expect(typeof marker).toBe('object');
        expect(marker).not.toBeNull();

        // Source and image markers still have explicit type field
        if ('type' in marker && marker.type === 'source') {
          expect(marker).toHaveProperty('number');
        } else if ('type' in marker && marker.type === 'image') {
          expect(marker).toHaveProperty('src');
        }
      });
    });
  });

  it('should have properly formatted person markers', () => {
    stories.forEach((story) => {
      if (!story.markers) return;

      Object.entries(story.markers).forEach(([_key, marker]) => {
        if ('person' in marker) {
          expect(typeof marker.person).toBe('string');
          if ('gender' in marker) {
            expect(['m', 'f', 'x']).toContain(marker.gender);
          }
          if ('age' in marker) {
            expect(typeof marker.age).toBe('number');
            expect(marker.age).toBeGreaterThan(0);
            expect(marker.age).toBeLessThan(150);
          }
        }
      });
    });
  });

  it('should have properly formatted number markers', () => {
    stories.forEach((story) => {
      if (!story.markers) return;

      Object.values(story.markers).forEach((marker) => {
        if ('number' in marker) {
          expect(typeof marker.number).toBe('number');
          expect(marker.number).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  it('should have properly formatted currency markers', () => {
    stories.forEach((story) => {
      if (!story.markers) return;

      Object.values(story.markers).forEach((marker) => {
        if ('currency' in marker) {
          expect(typeof marker.currency).toBe('number');
          expect(marker.currency).toBeGreaterThan(0);
        }
      });
    });
  });
});

describe('Story Translation Validation', () => {
  it('should successfully translate stories for sample countries', () => {
    const testCountries = ['US', 'UK', 'CZ'];

    testCountries.forEach((countryCode) => {
      const countryData = getCountryByCode(countryCode);
      if (!countryData) return;

      stories.forEach((story) => {
        // Should not throw
        const translated = translateStory({
          storySlug: story.slug,
          country: countryCode as any,
          language: 'en',
          contextualizationEnabled: true,
        });

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
        });
      });
    });
  });

  it('should detect and translate markers in story content', () => {
    // Find a story with markers
    const storyWithMarkers = stories.find((s) => s.content.includes('{{'));
    if (storyWithMarkers) {
      const translated = translateStory({
        storySlug: storyWithMarkers.slug,
        country: 'IR',
        language: 'fa',
        contextualizationEnabled: false,
      });

      // Should have some translated segments (not all text)
      const hasTranslatedSegments = [
        ...translated.title,
        ...translated.summary,
        ...translated.content,
      ].some((seg) => seg.type !== null);

      expect(hasTranslatedSegments).toBe(true);
    }
  });

  it('should preserve original values for translated segments', () => {
    stories.forEach((story) => {
      const translated = translateStory({
        storySlug: story.slug,
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      // This test verifies that WHEN a marker is translated, it has an original value
      // Not all markers will be translated (e.g., some Iranian names may stay as-is)
      // So we check that at least some segments have original values
      const segmentsWithOriginal = [
        ...translated.title,
        ...translated.summary,
        ...translated.content,
      ].filter((seg) => seg.original !== undefined);

      // If there are markers in the story, at least some should have originals
      if (story.markers && Object.keys(story.markers).length > 0) {
        expect(segmentsWithOriginal.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Story Marker Validation', () => {
  it('should have properly formatted V2 markers', () => {
    stories.forEach((story) => {
      const allText = [story.title, story.summary, story.content].join(' ');
      const markers = allText.match(/\{\{[^}]+\}\}/g) || [];

      markers.forEach((marker) => {
        // V2 format: {{key}} or {{key:suffix}}
        expect(marker).toMatch(/^\{\{[a-z0-9-]+(?::[a-z0-9-]+)?\}\}$/);

        // Extract key and optional suffix
        const match = marker.match(/^\{\{([a-z0-9-]+)(?::([a-z0-9-]+))?\}\}$/);
        expect(match).not.toBeNull();
        if (match) {
          const [, key, suffix] = match;
          // Key should not be empty
          expect(key.length).toBeGreaterThan(0);

          // If suffix exists, check validity
          if (suffix) {
            // Special case: {{source:key}} and {{image:key}} use suffix as marker key
            if (key === 'source' || key === 'image') {
              // Suffix is a marker key, should be defined
              // (validated in another test)
            } else {
              // Regular marker suffix (age, comparable, etc.)
              expect(['age', 'comparable', 'original', 'translated']).toContain(suffix);
            }
          }
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

  it('should have marker definitions for all referenced markers', () => {
    stories.forEach((story) => {
      const allText = [story.title, story.summary, story.content].join(' ');
      const markerRefs = allText.match(/\{\{([a-z0-9-]+)(?::[a-z0-9-]+)?\}\}/g) || [];

      markerRefs.forEach((ref) => {
        const match = ref.match(/^\{\{([a-z0-9-]+)(?::([a-z0-9-]+))?\}\}$/);
        if (match) {
          const [, key] = match;
          // Marker should be defined (unless it's a special prefix like 'source' or 'image')
          if (key !== 'source' && key !== 'image') {
            expect(story.markers).toBeDefined();
            expect(story.markers[key]).toBeDefined();
          }
        }
      });
    });
  });
});
