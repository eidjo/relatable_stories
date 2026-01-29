import { describe, it, expect } from 'vitest';
import { stories, getStoryBySlug, getStoryById } from './index';
import type { Story } from '$lib/types';

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
      // Extract all markers from content, title, and summary
      const markerRegex = /\{\{([^:]+):([^}]+)\}\}/g;
      const allText = `${story.title} ${story.summary} ${story.content}`;
      const matches = allText.matchAll(markerRegex);

      for (const match of matches) {
        const markerKey = match[2];
        expect(
          story.markers[markerKey],
          `Marker ${markerKey} used in story ${story.id} but not defined in markers`
        ).toBeDefined();

        const marker = story.markers[markerKey];
        expect(marker).toHaveProperty('type');
        expect(typeof marker.type).toBe('string');
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
    const validMarkerTypes = [
      'person',
      'place',
      'date',
      'time',
      'number',
      'currency',
      'event',
      'occupation',
      'subject',
      'source',
      'image',
    ];

    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([key, marker]) => {
        expect(validMarkerTypes).toContain(marker.type);
      });
    });
  });

  it('should have properly formatted person markers', () => {
    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([key, marker]) => {
        if (marker.type === 'person') {
          expect(marker).toHaveProperty('gender');
          expect(['male', 'female', 'neutral']).toContain(marker.gender);
        }
      });
    });
  });

  it('should have properly formatted number markers', () => {
    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([key, marker]) => {
        if (marker.type === 'number') {
          expect(marker).toHaveProperty('base');
          expect(marker).toHaveProperty('unit');
          expect(typeof marker.base).toBe('number');
          expect(typeof marker.unit).toBe('string');
        }
      });
    });
  });

  it('should have properly formatted currency markers', () => {
    stories.forEach((story) => {
      Object.entries(story.markers).forEach(([key, marker]) => {
        if (marker.type === 'currency') {
          expect(marker).toHaveProperty('base');
          expect(marker).toHaveProperty('base-currency');
          expect(typeof marker.base).toBe('number');
          expect(typeof marker['base-currency']).toBe('string');
        }
      });
    });
  });
});
