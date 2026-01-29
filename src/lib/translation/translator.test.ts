import { describe, it, expect } from 'vitest';
import { translateStory, translateText, type UITranslationContext } from './translator';
import type { Story } from '$lib/types';
import type { PlacesDataV2 } from './core';

const mockPlacesV2: PlacesDataV2 = {
  cities: [
    {
      id: 'test-city',
      name: 'Portland',
      size: 'medium',
      capital: false,
      population: 652000,
      landmarks: {
        protest: ['Pioneer Courthouse Square', 'Chapman Square'],
      },
      universities: ['Portland State University'],
      'government-facilities': ['Multnomah County Detention Center'],
    },
  ],
  generic: {
    landmarks: {
      protest: ['City Plaza', 'Town Square'],
    },
  },
};

const mockContext: UITranslationContext = {
  country: 'US',
  countryData: {
    population: 331900000,
    'currency-symbol': '$',
    'rial-to-local': 0.000024,
  },
  names: {
    male: ['John', 'Michael', 'James'],
    female: ['Emma', 'Olivia', 'Ava'],
    neutral: ['Alex', 'Jordan', 'Casey'],
  },
  places: mockPlacesV2,
};

const mockStory: Story = {
  id: 'test-story',
  title: "{{person1}}'s Story",
  slug: 'test-story',
  date: '2022-09-20',
  summary: 'A story about {{person1}} from {{city}}.',
  content: '{{person1}} was arrested with {{count}} others.',
  markers: {
    person1: {
      person: 'Zahra',
      gender: 'f' as const,
      age: 25,
    },
    city: {
      place: 'Tehran',
      'city-medium': true,
    },
    count: {
      number: 50,
    },
  },
  tags: ['test'],
  hashtags: '#test',
  severity: 'high',
  verified: true,
  source: 'Test source',
};

describe('Translation Engine', () => {
  describe('translateText', () => {
    it('should translate person markers', () => {
      const result = translateText(
        '{{person1}} went to the store',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].text).not.toBe('{{person1}}');
      expect(result[0].original).toBe('Zahra');
      expect(['Emma', 'Olivia', 'Ava']).toContain(result[0].text);
    });

    it('should translate place markers', () => {
      const result = translateText('In {{city}}', mockStory.markers, mockContext, 'test-story');

      expect(result[0].text).toBe('In ');
      expect(result[1].text).toBe('Portland');
      expect(result[1].original).toBe('Tehran');
    });

    it('should translate number markers', () => {
      const result = translateText(
        '{{count}} people',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result[0].text).toBe('50');
      expect(result[0].original).toBe('50');
    });

    it('should preserve non-marker text', () => {
      const result = translateText(
        'This is plain text',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result.length).toBe(1);
      expect(result[0].text).toBe('This is plain text');
      expect(result[0].type).toBeNull();
    });

    it('should handle mixed content', () => {
      const result = translateText(
        'Hello {{person1}}, welcome!',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result.length).toBe(3);
      expect(result[0].text).toBe('Hello ');
      expect(['Emma', 'Olivia', 'Ava']).toContain(result[1].text);
      expect(result[1].original).toBe('Zahra');
      expect(result[2].text).toBe(', welcome!');
    });
  });

  describe('translateStory', () => {
    it('should translate all story fields', () => {
      const translated = translateStory(mockStory, mockContext);

      expect(translated.id).toBe('test-story');
      expect(translated.slug).toBe('test-story');
      expect(translated.title).toBeDefined();
      expect(translated.summary).toBeDefined();
      expect(translated.content).toBeDefined();
    });

    it('should preserve story metadata', () => {
      const translated = translateStory(mockStory, mockContext);

      expect(translated.tags).toEqual(mockStory.tags);
      expect(translated.severity).toBe(mockStory.severity);
      expect(translated.verified).toBe(mockStory.verified);
      expect(translated.source).toBe(mockStory.source);
    });

    it('should provide deterministic translations', () => {
      const translated1 = translateStory(mockStory, mockContext);
      const translated2 = translateStory(mockStory, mockContext);

      // Title should be the same for same story+context
      expect(translated1.title).toEqual(translated2.title);
      expect(translated1.content).toEqual(translated2.content);
    });
  });

  describe('Number Scaling', () => {
    it('should scale numbers based on population when scaled is true', () => {
      const markers = {
        scaledNum: {
          number: 100,
          scaled: true,
        },
      };

      const result = translateText('{{scaledNum}}', markers, mockContext, 'test-story');

      // US population ~331M vs Iran ~85M = ~3.89x
      const scaled = parseInt(result[0].text);
      expect(scaled).toBeCloseTo(390, 2);
      expect(result[0].original).toBe('100');
    });
  });

  describe('Suffix Notation', () => {
    it('should handle age suffix for person markers', () => {
      const result = translateText(
        '{{person1:age}} years old',
        mockStory.markers,
        mockContext,
        'test-story'
      );

      expect(result[0].text).toBe('25');
      expect(result[1].text).toBe(' years old');
    });
  });
});
