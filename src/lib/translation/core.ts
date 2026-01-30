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

import type { Marker, DateMarker, TimeMarker } from '../types/index.ts';
import {
  isPersonMarker,
  isPlaceMarker,
  isNumberMarker,
  isCasualtiesMarker,
  isAliasMarker,
} from '../types/index.ts';
import { getPlaceFacilityTypes, getNestedValue } from './schema-helpers.ts';

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
  localizedNames?: Record<string, string>; // Language code -> localized name
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
  hospitals?: string[];
  morgues?: string[];
  prisons?: string[];
  'police-stations'?: string[];
}

/**
 * Places data structure (V2)
 */
export interface PlacesDataV2 {
  cities: CityData[];
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
  languageCode?: string; // Language code for localized comparison text
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
  comparison?: string; // For casualties with comparable events
  comparisonExplanation?: string; // Math explanation for comparison
  explanation?: string; // Math explanation for scaled values
}

/**
 * Deterministic selection from array using seed
 */
function selectFromArray<T>(items: T[], seed: string): T {
  // Use seededRandom to match translation script behavior
  const randomValue = seededRandom(seed);
  const index = Math.floor(randomValue * items.length);
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
 * Returns null if no reasonably close match is found (within 3x range)
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

  // Find closest by casualties and return it
  // We always show the closest match - the comparison text will handle large multipliers
  const closest = candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.casualties - casualties);
    const currentDiff = Math.abs(current.casualties - casualties);
    return currentDiff < bestDiff ? current : best;
  });

  return closest;
}

/**
 * Get localized multiplier phrase
 */
function getLocalizedMultiplier(
  multiplier: number,
  languageCode: string
): { phrase: string; needsArticle: boolean } {
  const formatted = multiplier.toLocaleString();

  // Language-specific translations
  const translations: Record<
    string,
    { twice: string; thrice: string; times: (n: string) => string; needsArticle: boolean }
  > = {
    en: { twice: 'twice', thrice: 'three times', times: (n) => `${n} times`, needsArticle: true },
    cs: {
      twice: 'dvakrát více než',
      thrice: 'třikrát více než',
      times: (n) => `${n}krát více než`,
      needsArticle: false,
    },
    de: { twice: 'zweimal', thrice: 'dreimal', times: (n) => `${n}-mal`, needsArticle: false },
    fr: {
      twice: 'deux fois',
      thrice: 'trois fois',
      times: (n) => `${n} fois`,
      needsArticle: false,
    },
    es: {
      twice: 'el doble de',
      thrice: 'el triple de',
      times: (n) => `${n} veces`,
      needsArticle: false,
    },
    it: {
      twice: 'il doppio di',
      thrice: 'il triplo di',
      times: (n) => `${n} volte`,
      needsArticle: false,
    },
    nl: { twice: 'twee keer', thrice: 'drie keer', times: (n) => `${n} keer`, needsArticle: false },
  };

  const lang = translations[languageCode] || translations['en'];

  let phrase: string;
  if (multiplier === 2) {
    phrase = lang.twice;
  } else if (multiplier === 3) {
    phrase = lang.thrice;
  } else {
    phrase = lang.times(formatted);
  }

  return { phrase, needsArticle: lang.needsArticle };
}

/**
 * Generate comparison text for casualties
 */
function generateComparisonText(
  scaledCasualties: number,
  event: ComparableEvent,
  languageCode: string = 'en'
): { text: string; explanation: string } {
  const exactRatio = scaledCasualties / event.casualties;

  // Use localized event name if available, otherwise fall back to English
  const eventName = (event.localizedNames?.[languageCode] || event.name).trim();

  let comparisonText: string;

  // Within 15% margin (0.85-1.15x) - say "approximately"
  if (exactRatio >= 0.85 && exactRatio <= 1.15) {
    comparisonText = `approximately ${event.fullName || eventName}`;
  }
  // Fractional comparisons (less than the event)
  else if (exactRatio < 0.85) {
    // Determine fraction phrase
    let fractionPhrase: string;
    if (exactRatio <= 0.35) {
      fractionPhrase = languageCode === 'en' ? 'a third of' : 'třetina'; // Add more languages as needed
    } else if (exactRatio <= 0.55) {
      fractionPhrase = languageCode === 'en' ? 'half of' : 'polovina';
    } else {
      fractionPhrase = languageCode === 'en' ? 'two-thirds of' : 'dvě třetiny';
    }
    comparisonText = `${fractionPhrase} ${event.fullName || eventName}`;
  }
  // Multiple times more (greater than the event)
  else {
    const multiplier = Math.round(exactRatio);
    // Get localized multiplier phrase
    const { phrase, needsArticle } = getLocalizedMultiplier(multiplier, languageCode);

    // Build comparison text with or without article
    comparisonText = needsArticle ? `${phrase} the ${eventName}` : `${phrase} ${eventName}`;
  }

  // Wrap in brackets
  const text = `(${comparisonText})`;

  // Generate explanation (always in English for consistency)
  const ratioText =
    exactRatio >= 1 ? `${exactRatio.toFixed(2)}x more` : `${(exactRatio * 100).toFixed(0)}% of`;
  const explanation = `Comparison: ${scaledCasualties.toLocaleString()} casualties vs. ${event.name} (${event.casualties.toLocaleString()} casualties in ${event.year}) = ${ratioText}`;

  return { text, explanation };
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
    if (marker.within) {
      // Resolve parent if not already resolved
      if (!context.resolved.has(marker.within)) {
        const parentMarker = context.markers[marker.within];
        if (parentMarker) {
          const parentResult = translateMarkerV2(marker.within, parentMarker, data, context);
          context.resolved.set(marker.within, parentResult);
        }
      }

      // Now get the resolved parent
      if (context.resolved.has(marker.within)) {
        const parentPlace = context.resolved.get(marker.within)!;
        const cityName = parentPlace.value;

        // Find the city data
        const cityData = findCityByName(data.places, cityName);
        if (cityData) {
          // Determine subcategory
          let items: string[] = [];

          // Special case: generic landmark (any type)
          if (marker.landmark && cityData.landmarks) {
            const allLandmarks = Object.values(cityData.landmarks)
              .flat()
              .filter((x): x is string => typeof x === 'string');
            items = allLandmarks;
          } else {
            // Schema-driven facility matching
            const facilityTypes = getPlaceFacilityTypes();
            for (const { property, dataPath } of facilityTypes) {
              const markerHasType = (marker as any)[property] === true;
              const cityHasData = getNestedValue(cityData, dataPath);

              if (markerHasType && cityHasData && Array.isArray(cityHasData)) {
                items = cityHasData;
                break;
              }
            }
          }

          if (items.length > 0) {
            return {
              value: selectFromArray(items, seed),
              original: marker.place,
            };
          }
        }
      }
    }

    // No parent or parent not resolved - use city selection
    const size = marker['city-large']
      ? 'large'
      : marker['city-medium']
        ? 'medium'
        : marker['city-small']
          ? 'small'
          : null;

    if (size && data.places.cities) {
      // Select from cities of this size, respecting capital requirement
      const cities = data.places.cities.filter(
        (c) => c.size === size && (!marker.capital || c.capital)
      );
      if (cities.length > 0) {
        const selectedCity = selectFromArray(cities, seed);
        return {
          value: selectedCity.name,
          original: marker.place,
        };
      }
    }

    // If no specific place found, try to find ANY city with the required landmark/facility
    if (marker['landmark-protest']) {
      const citiesWithLandmark = data.places.cities.filter(
        (c) => c.landmarks?.protest && c.landmarks.protest.length > 0
      );
      if (citiesWithLandmark.length > 0) {
        const city = selectFromArray(citiesWithLandmark, seed);
        return {
          value: selectFromArray(city.landmarks!.protest!, seed),
          original: marker.place,
        };
      }
    }

    if (marker['landmark-monument']) {
      const citiesWithLandmark = data.places.cities.filter(
        (c) => c.landmarks?.monument && c.landmarks.monument.length > 0
      );
      if (citiesWithLandmark.length > 0) {
        const city = selectFromArray(citiesWithLandmark, seed);
        return {
          value: selectFromArray(city.landmarks!.monument!, seed),
          original: marker.place,
        };
      }
    }

    if (marker.university) {
      const citiesWithUniversities = data.places.cities.filter(
        (c) => c.universities && c.universities.length > 0
      );
      if (citiesWithUniversities.length > 0) {
        const city = selectFromArray(citiesWithUniversities, seed);
        return {
          value: selectFromArray(city.universities!, seed),
          original: marker.place,
        };
      }
    }

    if (marker['government-facility']) {
      const citiesWithFacilities = data.places.cities.filter(
        (c) => c['government-facilities'] && c['government-facilities'].length > 0
      );
      if (citiesWithFacilities.length > 0) {
        const city = selectFromArray(citiesWithFacilities, seed);
        return {
          value: selectFromArray(city['government-facilities']!, seed),
          original: marker.place,
        };
      }
    }

    // Last resort fallback - return original
    return {
      value: marker.place,
      original: null,
    };
  }

  // Number
  if (isNumberMarker(marker)) {
    let value = marker.number;
    let explanation: string | undefined = undefined;

    // Population scaling (optional, author-controlled)
    if (marker.scaled) {
      const iranPop = 85000000;
      const ratio = data.population / iranPop;
      const scaleFactor = marker.scaleFactor ?? 1.0; // Default to pure ratio
      value = Math.round(value * ratio * scaleFactor);

      // Generate explanation
      const countryName = data.country;
      explanation = `Scaled from Iran (${marker.number.toLocaleString()}) to ${countryName} by population ratio: ${marker.number.toLocaleString()} × (${(data.population / 1000000).toFixed(1)}M / ${(iranPop / 1000000).toFixed(1)}M)${scaleFactor !== 1.0 ? ` × ${scaleFactor}` : ''} = ${value.toLocaleString()}`;
    }

    // Variance
    if (marker.variance) {
      const variance = marker.variance;
      // Simple random from seed
      const rand =
        (Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000) / 1000;
      const adjustment = Math.floor((rand - 0.5) * 2 * variance);
      value += adjustment;
    }

    return {
      value: value.toLocaleString(),
      original: marker.number.toLocaleString(),
      explanation,
    };
  }

  // Casualties (NEW)
  if (isCasualtiesMarker(marker)) {
    // Step 1: Determine the population to scale against
    let targetPopulation = data.population; // Default: country population
    let sourcePopulation = 85000000; // Iran's population
    let scopeType = 'country';
    let scopeName = data.country;

    if (marker.scope === 'city' && marker.scopeCity) {
      // Scale against city population instead
      const cityMarker = context.markers[marker.scopeCity];
      if (cityMarker && 'population' in cityMarker && typeof cityMarker.population === 'number') {
        targetPopulation = cityMarker.population;
        sourcePopulation = cityMarker.population; // Use same city's population as source
        scopeType = 'city';

        // Also check if we've resolved the city to get its translated population
        if (context.resolved.has(marker.scopeCity)) {
          const resolvedCity = context.resolved.get(marker.scopeCity);
          // Try to find the translated city's population from places data
          const cityName = resolvedCity?.value;
          if (cityName) {
            scopeName = cityName;
            const translatedCity = data.places.cities?.find((c) => c.name === cityName);
            if (translatedCity?.population) {
              targetPopulation = translatedCity.population;
            }
          }
        }
      }
    }

    // Step 2: Scale to local context - pure population ratio
    const scaledValue = Math.round(marker.casualties * (targetPopulation / sourcePopulation));

    // Generate explanation for scaling
    const iranPop = marker.scope === 'city' ? sourcePopulation : 85000000;
    const explanation = `Scaled from Iran (${marker.casualties.toLocaleString()}) to ${scopeName} by ${scopeType} population: ${marker.casualties.toLocaleString()} × (${(targetPopulation / 1000000).toFixed(1)}M / ${(iranPop / 1000000).toFixed(1)}M) = ${scaledValue.toLocaleString()}`;

    // Step 3: Find comparable event using SCALED value
    let comparison: string | undefined = undefined;
    let comparisonExplanation: string | undefined = undefined;
    if (marker.comparable && data.comparableEvents && data.comparableEvents.length > 0) {
      const category = marker.comparable === 'any' ? null : marker.comparable;
      const event = findClosestEvent(data.comparableEvents, scaledValue, category);

      if (event) {
        const result = generateComparisonText(scaledValue, event, data.languageCode || 'en');
        comparison = result.text;
        comparisonExplanation = result.explanation;
      }
    }

    // Step 4: Handle comparisons to other markers
    if (marker.comparedTo && context.resolved.has(marker.comparedTo)) {
      const referenceResult = context.resolved.get(marker.comparedTo)!;
      const referenceValue = parseInt(referenceResult.value);
      const ratio = scaledValue / referenceValue;

      if (ratio > 2) {
        comparison = `more than ${Math.round(ratio)} times`;
        comparisonExplanation = `Comparison: ${scaledValue.toLocaleString()} vs. ${referenceValue.toLocaleString()} = ${Math.round(ratio)}x more`;
      } else if (ratio > 1.5) {
        comparison = 'more than twice as many';
        comparisonExplanation = `Comparison: ${scaledValue.toLocaleString()} vs. ${referenceValue.toLocaleString()} = ${ratio.toFixed(1)}x more`;
      }
    }

    return {
      value: scaledValue.toLocaleString(),
      original: marker.casualties.toLocaleString(),
      comparison,
      comparisonExplanation,
      explanation,
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

  // Text markers (chants, quotes, etc.)
  if ('text' in marker && typeof (marker as any).text === 'string') {
    return {
      value: (marker as any).text,
      original: null,
    };
  }

  // Occupation markers (jobs, professions)
  if ('occupation' in marker && typeof (marker as any).occupation === 'string') {
    return {
      value: (marker as any).occupation,
      original: null,
    };
  }

  // Currency markers
  if ('currency' in marker && typeof (marker as any).currency === 'number') {
    const amount = (marker as any).currency;
    // Convert from Iranian Rial to local currency
    const localAmount = Math.round(amount * data.rialToLocal);
    return {
      value: `${data.currencySymbol}${localAmount.toLocaleString()}`,
      original: `${amount.toLocaleString()} Rial`,
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
    if (
      'type' in marker &&
      (marker.type === 'source' || marker.type === 'image' || marker.type === 'paragraph-break')
    ) {
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
