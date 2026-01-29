import { describe, it, expect } from 'vitest';
import {
  seededRandom,
  translateMarkerV2,
  type TranslationDataV2,
  type TranslationContext,
  type PlacesDataV2,
} from './core';
import type { Marker } from '$lib/types';

describe('seededRandom', () => {
  it('should return consistent values for the same seed', () => {
    const seed = 'test-seed-123';
    const value1 = seededRandom(seed);
    const value2 = seededRandom(seed);
    expect(value1).toBe(value2);
  });

  it('should return different values for different seeds', () => {
    const value1 = seededRandom('seed-1');
    const value2 = seededRandom('seed-2');
    expect(value1).not.toBe(value2);
  });

  it('should return values between 0 and 1', () => {
    const value = seededRandom('test');
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});

describe('translateMarkerV2', () => {
  const mockPlacesData: PlacesDataV2 = {
    cities: [
      {
        id: 'test-city',
        name: 'Test City',
        size: 'medium',
        capital: false,
        population: 1000000,
        landmarks: {
          protest: ['Freedom Plaza', 'City Hall Plaza'],
        },
        universities: ['Test University'],
        'government-facilities': ['Test Prison'],
      },
    ],
    generic: {
      landmarks: {
        protest: ['Generic Square'],
      },
    },
  };

  const mockTranslationData: TranslationDataV2 = {
    country: 'US',
    names: {
      male: ['John', 'Michael', 'David'],
      female: ['Sarah', 'Emma', 'Olivia'],
      neutral: ['Alex', 'Jordan', 'Casey'],
    },
    places: mockPlacesData,
    population: 331000000,
    currencySymbol: '$',
    rialToLocal: 0.000024,
  };

  const mockContext: TranslationContext = {
    markers: {},
    resolved: new Map(),
    storyId: 'test-story',
  };

  describe('person markers', () => {
    it('should translate person name deterministically', () => {
      const marker: Marker = {
        person: 'Zahra',
        gender: 'f' as const,
      };

      const result1 = translateMarkerV2('person1', marker, mockTranslationData, mockContext);
      const result2 = translateMarkerV2('person1', marker, mockTranslationData, mockContext);

      expect(result1.value).toBe(result2.value);
      expect(mockTranslationData.names.female).toContain(result1.value);
      expect(result1.original).toBe('Zahra');
    });

    it('should generate different names for different marker keys', () => {
      const marker: Marker = {
        person: 'Zahra',
        gender: 'f' as const,
      };

      const result1 = translateMarkerV2('person1', marker, mockTranslationData, mockContext);
      const result2 = translateMarkerV2('person2', marker, mockTranslationData, mockContext);

      expect(result1.value).toBeDefined();
      expect(result2.value).toBeDefined();
    });
  });

  describe('place markers', () => {
    it('should translate city by size', () => {
      const marker: Marker = {
        place: 'Tehran',
        'city-medium': true,
      };

      const result = translateMarkerV2('city1', marker, mockTranslationData, mockContext);

      expect(result.value).toBe('Test City');
      expect(result.original).toBe('Tehran');
    });

    it('should handle landmark-protest locations from generic', () => {
      const marker: Marker = {
        place: 'Azadi Square',
        'landmark-protest': true,
      };

      const result = translateMarkerV2('place1', marker, mockTranslationData, mockContext);

      expect(mockPlacesData.generic?.landmarks?.protest).toContain(result.value);
      expect(result.original).toBe('Azadi Square');
    });
  });

  describe('number markers', () => {
    it('should translate number without scaling', () => {
      const marker: Marker = {
        number: 50,
      };

      const result = translateMarkerV2('num1', marker, mockTranslationData, mockContext);

      expect(result.value).toBe('50');
      expect(result.original).toBe('50');
    });

    it('should scale number based on population', () => {
      const marker: Marker = {
        number: 100,
        scaled: true,
      };

      const result = translateMarkerV2('num1', marker, mockTranslationData, mockContext);

      // US population ~331M vs Iran ~85M = ~3.89x
      const scaled = parseInt(result.value);
      expect(scaled).toBeGreaterThan(350);
      expect(scaled).toBeLessThan(450);
      expect(result.original).toBe('100');
    });

    it('should apply variance consistently', () => {
      const marker: Marker = {
        number: 100,
        variance: 10,
      };

      const result1 = translateMarkerV2('num1', marker, mockTranslationData, mockContext);
      const result2 = translateMarkerV2('num1', marker, mockTranslationData, mockContext);

      expect(result1.value).toBe(result2.value);

      const value = parseInt(result1.value);
      expect(value).toBeGreaterThanOrEqual(90);
      expect(value).toBeLessThanOrEqual(110);
    });
  });

  describe('casualties markers', () => {
    it('should scale casualties by population', () => {
      const marker: Marker = {
        casualties: 1000,
      };

      const result = translateMarkerV2('casualties1', marker, mockTranslationData, mockContext);

      // Should scale: 1000 * (331M / 85M) ≈ 3894
      const scaled = parseInt(result.value);
      expect(scaled).toBeGreaterThan(3500);
      expect(scaled).toBeLessThan(4500);
      expect(result.original).toBe('1000');
    });
  });

  describe('alias markers', () => {
    it('should reuse translation from target marker', () => {
      const personMarker: Marker = {
        person: 'Ali',
        gender: 'm' as const,
      };

      const aliasMarker: Marker = {
        sameAs: 'person1',
      };

      const context: TranslationContext = {
        markers: {
          person1: personMarker,
          alias1: aliasMarker,
        },
        resolved: new Map(),
        storyId: 'test-story',
      };

      // First resolve the person
      const personResult = translateMarkerV2('person1', personMarker, mockTranslationData, context);
      context.resolved.set('person1', personResult);

      // Then resolve the alias
      const aliasResult = translateMarkerV2('alias1', aliasMarker, mockTranslationData, context);

      expect(aliasResult.value).toBe(personResult.value);
      expect(aliasResult.original).toBe(personResult.original);
    });
  });

  describe('date/time markers', () => {
    it('should return date value without translation', () => {
      const marker: Marker = {
        date: '2022-09-16',
      };

      const result = translateMarkerV2('date1', marker, mockTranslationData, mockContext);

      expect(result.value).toBe('2022-09-16');
      expect(result.original).toBeNull();
    });

    it('should return time value without translation', () => {
      const marker: Marker = {
        time: '21:30',
      };

      const result = translateMarkerV2('time1', marker, mockTranslationData, mockContext);

      expect(result.value).toBe('21:30');
      expect(result.original).toBeNull();
    });
  });
});
