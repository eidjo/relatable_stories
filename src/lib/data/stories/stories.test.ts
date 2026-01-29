import { describe, it, expect } from 'vitest';
import { stories, getStoryBySlug, getStoryById } from './index';

describe('Story Data Loading', () => {
  it('should load at least one story', () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  it('should have all required story fields', () => {
    stories.forEach((story) => {
      expect(story).toHaveProperty('id');
      expect(story).toHaveProperty('title');
      expect(story).toHaveProperty('slug');
      expect(story).toHaveProperty('date');
      expect(story).toHaveProperty('summary');
      expect(story).toHaveProperty('content');
      expect(story).toHaveProperty('markers');
      expect(story).toHaveProperty('tags');
      expect(story).toHaveProperty('severity');
      expect(story).toHaveProperty('verified');

      expect(typeof story.id).toBe('string');
      expect(typeof story.title).toBe('string');
      expect(typeof story.slug).toBe('string');
      expect(typeof story.content).toBe('string');
      expect(Array.isArray(story.tags)).toBe(true);
      expect(typeof story.verified).toBe('boolean');
    });
  });

  it('should have valid marker definitions for all markers used in content', () => {
    stories.forEach((story) => {
      // V2 format: {{key}} or {{key:suffix}} or {{source:id}} or {{image:id}}
      const markerRegex = /\{\{([a-z0-9-]+)(?::([a-z0-9-]+))?\}\}/g;
      const allText = `${story.title} ${story.summary} ${story.content}`;
      const matches = allText.matchAll(markerRegex);

      for (const match of matches) {
        const [_fullMatch, firstPart, secondPart] = match;

        // Handle special cases: {{source:id}} and {{image:id}}
        if (firstPart === 'source' && secondPart) {
          // Check in story.sources array
          const source = story.sources?.find(s => s.id === secondPart);
          expect(
            source,
            `Source ${secondPart} used in story ${story.id} but not defined in sources array`
          ).toBeDefined();
        } else if (firstPart === 'image' && secondPart) {
          // Check in story.images array
          const image = story.images?.find(img => img.id === secondPart);
          expect(
            image,
            `Image ${secondPart} used in story ${story.id} but not defined in images array`
          ).toBeDefined();
        } else {
          // Regular marker: {{key}} or {{key:suffix}}
          expect(
            story.markers[firstPart],
            `Marker ${firstPart} used in story ${story.id} but not defined in markers`
          ).toBeDefined();
        }
      }
    });
  });

  it('should have unique story IDs', () => {
    const ids = stories.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique story slugs', () => {
    const slugs = stories.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('should retrieve story by slug', () => {
    const firstStory = stories[0];
    const retrieved = getStoryBySlug(firstStory.slug);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(firstStory.id);
  });

  it('should retrieve story by id', () => {
    const firstStory = stories[0];
    const retrieved = getStoryById(firstStory.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.slug).toBe(firstStory.slug);
  });

  it('should return undefined for non-existent slug', () => {
    const retrieved = getStoryBySlug('non-existent-slug');
    expect(retrieved).toBeUndefined();
  });

  it('should have valid severity levels', () => {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    stories.forEach((story) => {
      expect(validSeverities).toContain(story.severity);
    });
  });

  it('should have valid marker types', () => {
    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([key, marker]) => {
        // V2 markers don't have an explicit 'type' field
        // They are identified by their fields
        expect(typeof marker).toBe('object');
        expect(marker).not.toBeNull();

        // Check that marker has at least one identifying field
        const hasIdentifyingField =
          'person' in marker ||
          'place' in marker ||
          'number' in marker ||
          'casualties' in marker ||
          'currency' in marker ||
          'occupation' in marker ||
          'date' in marker ||
          'time' in marker ||
          'text' in marker ||
          'sameAs' in marker ||
          ('type' in marker && typeof (marker as any).type === 'string');

        expect(
          hasIdentifyingField,
          `Marker ${key} in story ${story.id} has no identifying field`
        ).toBe(true);
      });
    });
  });

  it('should have properly formatted person markers', () => {
    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([_key, marker]) => {
        if ('person' in marker) {
          expect(marker).toHaveProperty('gender');
          expect(['m', 'f', 'x']).toContain(marker.gender);
          expect(typeof marker.person).toBe('string');

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
      Object.entries(story.markers).forEach(([_key, marker]) => {
        if ('number' in marker) {
          expect(typeof marker.number).toBe('number');
          expect(marker.number).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  it('should have properly formatted currency markers', () => {
    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([_key, marker]) => {
        if ('currency' in marker) {
          expect(typeof marker.currency).toBe('number');
          expect(marker.currency).toBeGreaterThan(0);
        }
      });
    });
  });
});
