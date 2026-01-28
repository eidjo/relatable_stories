import { describe, it, expect } from 'vitest';
import {
  seededRandom,
  selectFromArray,
  getOriginalValue,
  translateMarker,
  type TranslationData,
} from './core';
import type {
  PersonMarker,
  PlaceMarker,
  NumberMarker,
  CurrencyMarker,
  OccupationMarker,
  SubjectMarker,
} from '$lib/types';

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

describe('selectFromArray', () => {
  it('should select the same item for the same seed', () => {
    const items = ['apple', 'banana', 'cherry', 'date'];
    const seed = 'test-seed';
    const selection1 = selectFromArray(items, seed);
    const selection2 = selectFromArray(items, seed);
    expect(selection1).toBe(selection2);
  });

  it('should select from the provided array', () => {
    const items = ['apple', 'banana', 'cherry'];
    const seed = 'test';
    const selection = selectFromArray(items, seed);
    expect(items).toContain(selection);
  });
});

describe('getOriginalValue', () => {
  it('should return explicit original field for person marker', () => {
    const marker: PersonMarker = {
      type: 'person',
      gender: 'female',
      name: 'Zahra',
      original: 'Zahra (specific)',
    };
    expect(getOriginalValue(marker)).toBe('Zahra (specific)');
  });

  it('should return name field for person marker without explicit original', () => {
    const marker: PersonMarker = {
      type: 'person',
      gender: 'female',
      name: 'Zahra',
    };
    expect(getOriginalValue(marker)).toBe('Zahra');
  });

  it('should return original field for place marker', () => {
    const marker: PlaceMarker = {
      type: 'place',
      category: 'city',
      original: 'Tehran',
    };
    expect(getOriginalValue(marker)).toBe('Tehran');
  });

  it('should return base value for number marker', () => {
    const marker: NumberMarker = {
      type: 'number',
      base: 100,
      unit: 'people',
    };
    expect(getOriginalValue(marker)).toBe('100');
  });

  it('should return formatted Rial for currency marker', () => {
    const marker: CurrencyMarker = {
      type: 'currency',
      base: 50000000,
      'base-currency': 'IRR',
    };
    expect(getOriginalValue(marker)).toBe('50,000,000 Rial');
  });

  it('should return category for occupation marker without original', () => {
    const marker: OccupationMarker = {
      type: 'occupation',
      category: 'working-class',
    };
    expect(getOriginalValue(marker)).toBe('working-class');
  });
});

describe('translateMarker', () => {
  const mockTranslationData: TranslationData = {
    country: 'US',
    names: {
      male: ['John', 'Michael', 'David'],
      female: ['Sarah', 'Emma', 'Olivia'],
      neutral: ['Alex', 'Jordan', 'Casey'],
    },
    places: {
      'city-medium': ['Austin', 'Portland', 'Denver'],
      'landmark-protest': ['Freedom Plaza', 'City Hall Plaza'],
    },
    population: 331000000,
    currencySymbol: '$',
    rialToLocal: 0.000024,
  };

  describe('person markers', () => {
    it('should translate person name deterministically', () => {
      const marker: PersonMarker = {
        type: 'person',
        gender: 'female',
        name: 'Zahra',
      };

      const result1 = translateMarker('person1', marker, mockTranslationData, 'story-1');
      const result2 = translateMarker('person1', marker, mockTranslationData, 'story-1');

      expect(result1.translated).toBe(result2.translated);
      expect(mockTranslationData.names.female).toContain(result1.translated);
      expect(result1.original).toBe('Zahra');
    });

    it('should generate different names for different marker keys', () => {
      const marker: PersonMarker = {
        type: 'person',
        gender: 'female',
        name: 'Zahra',
      };

      const result1 = translateMarker('person1', marker, mockTranslationData, 'story-1');
      const result2 = translateMarker('person2', marker, mockTranslationData, 'story-1');

      // High probability of being different (not guaranteed due to randomness)
      expect(result1.translated).toBeDefined();
      expect(result2.translated).toBeDefined();
    });
  });

  describe('place markers', () => {
    it('should translate place with size', () => {
      const marker: PlaceMarker = {
        type: 'place',
        category: 'city',
        size: 'medium',
        original: 'Tehran',
      };

      const result = translateMarker('place1', marker, mockTranslationData, 'story-1');

      expect(mockTranslationData.places['city-medium']).toContain(result.translated);
      expect(result.original).toBe('Tehran');
    });

    it('should handle landmark-protest locations', () => {
      const marker: PlaceMarker = {
        type: 'place',
        category: 'landmark',
        significance: 'protest-location',
        original: 'Azadi Square',
      };

      const result = translateMarker('place1', marker, mockTranslationData, 'story-1');

      expect(mockTranslationData.places['landmark-protest']).toContain(result.translated);
      expect(result.original).toBe('Azadi Square');
    });
  });

  describe('number markers', () => {
    it('should translate number without scaling', () => {
      const marker: NumberMarker = {
        type: 'number',
        base: 50,
        unit: 'people',
      };

      const result = translateMarker('num1', marker, mockTranslationData, 'story-1');

      expect(result.translated).toBe('50');
      expect(result.original).toBe('50');
    });

    it('should scale number based on population', () => {
      const marker: NumberMarker = {
        type: 'number',
        base: 100,
        unit: 'people',
        scale: true,
        'scale-factor': 1,
      };

      const result = translateMarker('num1', marker, mockTranslationData, 'story-1');

      // US population ~331M vs Iran ~88.5M = ~3.74x
      // Should scale 100 by approximately this ratio
      const scaled = parseInt(result.translated);
      expect(scaled).toBeGreaterThan(300);
      expect(scaled).toBeLessThan(500);
      expect(result.original).toBe('100');
    });

    it('should apply variance consistently', () => {
      const marker: NumberMarker = {
        type: 'number',
        base: 100,
        unit: 'people',
        variance: 10,
      };

      const result1 = translateMarker('num1', marker, mockTranslationData, 'story-1');
      const result2 = translateMarker('num1', marker, mockTranslationData, 'story-1');

      expect(result1.translated).toBe(result2.translated);

      const value = parseInt(result1.translated);
      expect(value).toBeGreaterThanOrEqual(90);
      expect(value).toBeLessThanOrEqual(110);
    });
  });

  describe('currency markers', () => {
    it('should convert currency with correct symbol', () => {
      const marker: CurrencyMarker = {
        type: 'currency',
        base: 50000000, // 50 million Rial
        'base-currency': 'IRR',
      };

      const result = translateMarker('currency1', marker, mockTranslationData, 'story-1');

      // 50,000,000 * 0.000024 = 1,200
      expect(result.translated).toBe('$1,200');
      expect(result.original).toBe('50,000,000 Rial');
    });
  });

  describe('occupation markers', () => {
    it('should select from examples if provided', () => {
      const marker: OccupationMarker = {
        type: 'occupation',
        category: 'professional',
        examples: ['teacher', 'engineer', 'doctor'],
        original: 'moalem',
      };

      const result = translateMarker('occ1', marker, mockTranslationData, 'story-1');

      expect(marker.examples).toContain(result.translated);
      expect(result.original).toBe('moalem');
    });

    it('should use original as fallback', () => {
      const marker: OccupationMarker = {
        type: 'occupation',
        category: 'working-class',
        original: 'factory worker',
      };

      const result = translateMarker('occ1', marker, mockTranslationData, 'story-1');

      expect(result.translated).toBe('factory worker');
      expect(result.original).toBeNull();
    });
  });

  describe('subject markers', () => {
    it('should select from examples deterministically', () => {
      const marker: SubjectMarker = {
        type: 'subject',
        category: 'sciences',
        examples: ['physics', 'chemistry', 'biology'],
      };

      const result1 = translateMarker('subject1', marker, mockTranslationData, 'story-1');
      const result2 = translateMarker('subject1', marker, mockTranslationData, 'story-1');

      expect(result1.translated).toBe(result2.translated);
      expect(marker.examples).toContain(result1.translated);
      expect(result1.original).toBe('sciences');
    });
  });

  describe('date/time/event markers', () => {
    it('should return translation or value without original', () => {
      const marker = {
        type: 'event' as const,
        value: 'woman-life-freedom',
        translation: 'Woman, Life, Freedom',
      };

      const result = translateMarker('event1', marker, mockTranslationData, 'story-1');

      expect(result.translated).toBe('Woman, Life, Freedom');
      expect(result.original).toBeNull();
    });
  });
});
