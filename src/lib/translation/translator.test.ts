import { describe, it, expect } from 'vitest';
import { translateStory, translateText } from './translator';
import type { Story, TranslationContext } from '$lib/types';

const mockContext: TranslationContext = {
  country: 'US',
  countryData: {
    code: 'US',
    name: 'United States',
    population: 331900000,
    currency: 'USD',
    'currency-symbol': '$',
    'rial-to-local': 0.000024,
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
  },
  names: {
    male: ['John', 'Michael', 'James'],
    female: ['Emma', 'Olivia', 'Ava'],
    neutral: ['Alex', 'Jordan', 'Casey'],
  },
  places: {
    'city-medium': ['Portland', 'Austin', 'Seattle'],
    'landmark-protest': ['Freedom Plaza', 'City Hall Plaza'],
    'government-facility': ['Federal Detention Center'],
  },
};

const mockStory: Story = {
  id: 'test-story',
  title: "{{name:person1}}'s Story",
  slug: 'test-story',
  date: '2022-09-20',
  summary: 'A story about {{name:person1}} from {{place:city}}.',
  content: '{{name:person1}} was arrested with {{number:count}} others.',
  markers: {
    person1: {
      type: 'person',
      gender: 'female',
      age: 25,
      role: 'protester',
    },
    city: {
      type: 'place',
      category: 'city',
      size: 'medium',
    },
    count: {
      type: 'number',
      base: 50,
      unit: 'people',
      scale: false,
    },
  },
  tags: ['test'],
  severity: 'high',
  verified: true,
};

describe('Translation Engine', () => {
  describe('translateText', () => {
    it('should translate person markers', () => {
      const result = translateText(
        '{{name:person1}} went to the store',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].text).not.toBe('{{name:person1}}');
      expect(result[0].original).toBe('[Iranian name]'); // Now returns placeholder since no name provided
      expect(['Emma', 'Olivia', 'Ava']).toContain(result[0].text);
    });

    it('should translate place markers', () => {
      const result = translateText(
        'In {{place:city}}',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result[0].text).toBe('In ');
      expect(['Portland', 'Austin', 'Seattle']).toContain(result[1].text);
      expect(result[1].original).toBe('[Iranian location]'); // Placeholder since no original provided
    });

    it('should translate number markers', () => {
      const result = translateText(
        '{{number:count}} people',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result[0].text).toBe('50');
      expect(result[0].original).toBe('50'); // Returns the base number value
    });

    it('should preserve non-marker text', () => {
      const result = translateText('This is plain text', {}, mockContext, 'test-story');

      expect(result.length).toBe(1);
      expect(result[0].text).toBe('This is plain text');
      expect(result[0].original).toBeNull();
    });

    it('should handle mixed content', () => {
      const result = translateText(
        'Hello {{name:person1}}, welcome to {{place:city}}!',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result.length).toBe(5);
      expect(result[0].text).toBe('Hello ');
      expect(result[0].original).toBeNull();
      expect(result[1].original).toBe('[Iranian name]');
      expect(result[2].text).toBe(', welcome to ');
      expect(result[3].original).toBe('[Iranian location]');
      expect(result[4].text).toBe('!');
    });
  });

  describe('translateStory', () => {
    it('should translate all story fields', () => {
      const translated = translateStory(mockStory, mockContext);

      expect(translated.id).toBe(mockStory.id);
      expect(translated.slug).toBe(mockStory.slug);
      expect(translated.title).toBeDefined();
      expect(translated.summary).toBeDefined();
      expect(translated.content).toBeDefined();
      expect(Array.isArray(translated.title)).toBe(true);
      expect(Array.isArray(translated.summary)).toBe(true);
      expect(Array.isArray(translated.content)).toBe(true);
    });

    it('should preserve story metadata', () => {
      const translated = translateStory(mockStory, mockContext);

      expect(translated.tags).toEqual(mockStory.tags);
      expect(translated.severity).toBe(mockStory.severity);
      expect(translated.verified).toBe(mockStory.verified);
    });

    it('should provide deterministic translations', () => {
      const translation1 = translateStory(mockStory, mockContext);
      const translation2 = translateStory(mockStory, mockContext);

      // Same story + same context should produce same translations
      expect(translation1.title[0].text).toBe(translation2.title[0].text);
      expect(translation1.summary[0].text).toBe(translation2.summary[0].text);
    });
  });

  describe('Number Scaling', () => {
    it('should scale numbers based on population when scale is true', () => {
      const scaledMarkers = {
        count: {
          type: 'number' as const,
          base: 100,
          unit: 'people',
          scale: true,
          'scale-factor': 1,
        },
      };

      const result = translateText('{{number:count}} people', scaledMarkers, mockContext, 'test');

      const iranPopulation = 88550570;
      const expectedScaled = Math.round(
        (100 * mockContext.countryData.population) / iranPopulation
      );

      expect(parseInt(result[0].text)).toBeCloseTo(expectedScaled, -1);
    });
  });

  describe('Currency Conversion', () => {
    it('should convert currency to local currency', () => {
      const currencyMarkers = {
        amount: {
          type: 'currency' as const,
          base: 50000000,
          'base-currency': 'IRR',
        },
      };

      const result = translateText('{{currency:amount}}', currencyMarkers, mockContext, 'test');

      expect(result[0].text).toContain('$');
      expect(result[0].text).toMatch(/\d/);
      expect(result[0].original).toBe('50,000,000 Rial'); // Returns formatted Iranian currency
    });
  });
});
