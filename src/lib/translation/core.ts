/**
 * V2 Core Translation Logic
 *
 * Key improvements:
 * - Hierarchical place relationships (landmarks within cities)
 * - Casualties with automatic comparable events
 * - Pure population scaling (no arbitrary factors)
 * - Alias support (reuse translations)
 * - Context-aware translation (resolved values cache)
 */

import type {
  Marker,
  PersonMarker,
  PlaceMarker,
  NumberMarker,
  CasualtiesMarker,
  DateMarker,
  TimeMarker,
  AliasMarker,
} from '$lib/types';
import {
  isPersonMarker,
  isPlaceMarker,
  isNumberMarker,
  isCasualtiesMarker,
  isAliasMarker,
} from '$lib/types';

/**
 * Deterministic random number generator (seeded)
 * Ensures same story + country always generates same values
 */
export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Comparable event data structure
 */
export interface ComparableEvent {
  id: string;
  name: string;
  fullName?: string;
  casualties: number;
  category: string;
  year: number;
  significance?: string;
}

/**
 * Hierarchical city data structure
 */
export interface CityData {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  capital: boolean;
  population: number;
  region?: string;
  landmarks?: {
    protest?: string[];
    monument?: string[];
    [key: string]: string[] | undefined;
  };
  universities?: string[];
  'government-facilities'?: string[];
}

/**
 * Places data structure (V2)
 */
export interface PlacesDataV2 {
  cities: CityData[];
  generic?: {
    cities?: {
      small?: string[];
      medium?: string[];
      large?: string[];
    };
    landmarks?: {
      protest?: string[];
      monument?: string[];
      [key: string]: string[] | undefined;
    };
    universities?: string[];
    'government-facilities'?: string[];
  };
}

/**
 * Translation data needed for V2
 */
export interface TranslationDataV2 {
  country: string;
  names: {
    male: string[];
    female: string[];
    neutral: string[];
  };
  places: PlacesDataV2;
  population: number;
  currencySymbol: string;
  rialToLocal: number;
  comparableEvents?: ComparableEvent[];
}

/**
 * Translation context - tracks resolved markers for dependencies
 */
export interface TranslationContext {
  markers: Record<string, Marker>;
  resolved: Map<string, TranslationResult>;
  storyId: string;
}

/**
 * Result of translating a marker
 */
export interface TranslationResult {
  value: string;
  original: string | null;
  comparison?: string;  // For casualties with comparable events
}

/**
 * Deterministic selection from array using seed
 */
function selectFromArray<T>(items: T[], seed: string): T {
  // Simple hash-based selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % items.length;
  return items[index];
}

/**
 * Find city by name in places data
 */
function findCityByName(placesData: PlacesDataV2, cityName: string): CityData | null {
  for (const city of placesData.cities || []) {
    if (city.name === cityName) {
      return city;
    }
  }
  return null;
}

/**
 * Find closest comparable event by casualties
 */
function findClosestEvent(
  events: ComparableEvent[],
  casualties: number,
  category: string | null
): ComparableEvent | null {
  if (events.length === 0) return null;

  let candidates = events;

  // Filter by category if specified
  if (category) {
    const filtered = events.filter((e) => e.category === category);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  // Find closest by casualties
  return candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.casualties - casualties);
    const currentDiff = Math.abs(current.casualties - casualties);
    return currentDiff < bestDiff ? current : best;
  });
}

/**
 * Generate comparison text for casualties
 */
function generateComparisonText(
  scaledCasualties: number,
  event: ComparableEvent,
  maxMultiplier: number = 20
): string {
  const multiplier = Math.round(scaledCasualties / event.casualties);

  if (multiplier <= 1) {
    // Close enough - just name the event
    return event.fullName || event.name;
  } else if (multiplier <= maxMultiplier) {
    // Use multiplier
    const times =
      multiplier === 2
        ? 'twice'
        : multiplier === 3
        ? 'three times'
        : `${multiplier} times`;
    return `${times} the ${event.name}`;
  } else {
    // Too large - cap it
    return `more than ${maxMultiplier} times the ${event.name}`;
  }
}

/**
 * Translate a single marker in V2 system
 */
export function translateMarkerV2(
  key: string,
  marker: Marker,
  data: TranslationDataV2,
  context: TranslationContext
): TranslationResult {
  const seed = `${context.storyId}-${key}-${data.country}`;

  // Handle aliases first - reuse previous translation
  if (isAliasMarker(marker)) {
    const targetKey = marker.sameAs;
    if (context.resolved.has(targetKey)) {
      return context.resolved.get(targetKey)!;
    }
    // Resolve target first
    const targetMarker = context.markers[targetKey];
    if (targetMarker) {
      const result = translateMarkerV2(targetKey, targetMarker, data, context);
      context.resolved.set(targetKey, result);
      return result;
    }
    // Target not found - return error
    return {
      value: `[alias:${targetKey}]`,
      original: null,
    };
  }

  // Person
  if (isPersonMarker(marker)) {
    const nameList =
      marker.gender === 'm'
        ? data.names.male
        : marker.gender === 'f'
        ? data.names.female
        : data.names.neutral;

    // TODO: Regional names if 'from' specified
    // This would require regional name data in TranslationDataV2

    return {
      value: selectFromArray(nameList, seed),
      original: marker.person,
    };
  }

  // Place
  if (isPlaceMarker(marker)) {
    // Check if this place has a parent
    if (marker.within && context.resolved.has(marker.within)) {
      const parentPlace = context.resolved.get(marker.within)!;
      const cityName = parentPlace.value;

      // Find the city data
      const cityData = findCityByName(data.places, cityName);
      if (cityData) {
        // Determine subcategory
        let items: string[] = [];

        if (marker['landmark-protest'] && cityData.landmarks?.protest) {
          items = cityData.landmarks.protest;
        } else if (marker['landmark-monument'] && cityData.landmarks?.monument) {
          items = cityData.landmarks.monument;
        } else if (marker.landmark && cityData.landmarks) {
          // Any landmark
          const allLandmarks = Object.values(cityData.landmarks).flat().filter((x): x is string => typeof x === 'string');
          items = allLandmarks;
        } else if (marker.university && cityData.universities) {
          items = cityData.universities;
        } else if (marker['government-facility'] && cityData['government-facilities']) {
          items = cityData['government-facilities'];
        }

        if (items.length > 0) {
          return {
            value: selectFromArray(items, seed),
            original: marker.place,
          };
        }
      }
    }

    // No parent or parent not resolved - use generic lists or city selection
    const size = marker['city-large']
      ? 'large'
      : marker['city-medium']
      ? 'medium'
      : marker['city-small']
      ? 'small'
      : null;

    if (size && data.places.cities) {
      // Select from cities of this size
      const cities = data.places.cities.filter((c) => c.size === size);
      if (cities.length > 0) {
        const selectedCity = selectFromArray(cities, seed);
        return {
          value: selectedCity.name,
          original: marker.place,
        };
      }
    }

    // Fallback to generic lists
    if (marker['landmark-protest'] && data.places.generic?.landmarks?.protest) {
      return {
        value: selectFromArray(data.places.generic.landmarks.protest, seed),
        original: marker.place,
      };
    }

    if (marker['landmark-monument'] && data.places.generic?.landmarks?.monument) {
      return {
        value: selectFromArray(data.places.generic.landmarks.monument, seed),
        original: marker.place,
      };
    }

    if (marker.university && data.places.generic?.universities) {
      return {
        value: selectFromArray(data.places.generic.universities, seed),
        original: marker.place,
      };
    }

    if (marker['government-facility'] && data.places.generic?.['government-facilities']) {
      return {
        value: selectFromArray(data.places.generic['government-facilities'], seed),
        original: marker.place,
      };
    }

    // Last resort fallback
    return {
      value: marker.place,
      original: null,
    };
  }

  // Number
  if (isNumberMarker(marker)) {
    let value = marker.number;

    // Population scaling (optional, author-controlled)
    if (marker.scaled) {
      const iranPop = 85000000;
      const ratio = data.population / iranPop;
      const scaleFactor = marker.scaleFactor ?? 1.0; // Default to pure ratio
      value = Math.round(value * ratio * scaleFactor);
    }

    // Variance
    if (marker.variance) {
      const variance = marker.variance;
      // Simple random from seed
      const rand = Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000 / 1000;
      const adjustment = Math.floor((rand - 0.5) * 2 * variance);
      value += adjustment;
    }

    return {
      value: value.toString(),
      original: marker.number.toString(),
    };
  }

  // Casualties (NEW)
  if (isCasualtiesMarker(marker)) {
    // Step 1: Determine the population to scale against
    let targetPopulation = data.population; // Default: country population
    let sourcePopulation = 85000000; // Iran's population

    if (marker.scope === 'city' && marker.scopeCity) {
      // Scale against city population instead
      const cityMarker = context.markers[marker.scopeCity];
      if (cityMarker && 'population' in cityMarker && typeof cityMarker.population === 'number') {
        targetPopulation = cityMarker.population;
        sourcePopulation = cityMarker.population; // Use same city's population as source

        // Also check if we've resolved the city to get its translated population
        if (context.resolved.has(marker.scopeCity)) {
          const resolvedCity = context.resolved.get(marker.scopeCity);
          // Try to find the translated city's population from places data
          const cityName = resolvedCity?.value;
          if (cityName) {
            const translatedCity = data.places.cities?.find(c => c.name === cityName);
            if (translatedCity?.population) {
              targetPopulation = translatedCity.population;
            }
          }
        }
      }
    }

    // Step 2: Scale to local context - pure population ratio
    const scaledValue = Math.round(marker.casualties * (targetPopulation / sourcePopulation));

    // Step 3: Find comparable event using SCALED value
    let comparison: string | undefined = undefined;
    if (marker.comparable && data.comparableEvents && data.comparableEvents.length > 0) {
      const category = marker.comparable === 'any' ? null : marker.comparable;
      const event = findClosestEvent(data.comparableEvents, scaledValue, category);

      if (event) {
        comparison = generateComparisonText(scaledValue, event);
      }
    }

    // Step 4: Handle comparisons to other markers
    if (marker.comparedTo && context.resolved.has(marker.comparedTo)) {
      const referenceResult = context.resolved.get(marker.comparedTo)!;
      const referenceValue = parseInt(referenceResult.value);
      const ratio = scaledValue / referenceValue;

      if (ratio > 2) {
        comparison = `more than ${Math.round(ratio)} times`;
      } else if (ratio > 1.5) {
        comparison = 'more than twice as many';
      }
    }

    return {
      value: scaledValue.toString(),
      original: marker.casualties.toString(),
      comparison,
    };
  }

  // Date
  if ('date' in marker) {
    return {
      value: (marker as DateMarker).date,
      original: null, // Dates don't show strikethrough
    };
  }

  // Time
  if ('time' in marker) {
    return {
      value: (marker as TimeMarker).time,
      original: null,
    };
  }

  // Fallback for unknown types
  return {
    value: `[${key}]`,
    original: null,
  };
}

/**
 * Translate all markers in a story
 */
export function translateMarkersV2(
  markers: Record<string, Marker>,
  data: TranslationDataV2,
  storyId: string
): Record<string, TranslationResult> {
  const context: TranslationContext = {
    markers,
    resolved: new Map(),
    storyId,
  };

  const results: Record<string, TranslationResult> = {};

  for (const [key, marker] of Object.entries(markers)) {
    // Skip source and image markers (handled separately)
    if ('type' in marker && (marker.type === 'source' || marker.type === 'image' || marker.type === 'paragraph-break')) {
      continue;
    }

    if (!context.resolved.has(key)) {
      const result = translateMarkerV2(key, marker, data, context);
      context.resolved.set(key, result);
      results[key] = result;
    } else {
      results[key] = context.resolved.get(key)!;
    }
  }

  return results;
}
