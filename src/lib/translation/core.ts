/**
 * Core translation logic - pure functions with no framework dependencies
 * Used by both the website translator and build-time canvas renderer
 */

import type {
  Marker,
  PersonMarker,
  PlaceMarker,
  NumberMarker,
  CurrencyMarker,
  OccupationMarker,
  SubjectMarker,
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
 * Select an item deterministically from an array
 */
export function selectFromArray<T>(items: T[], seed: string): T {
  const index = Math.floor(seededRandom(seed) * items.length);
  return items[index];
}

/**
 * Context data needed for translation
 */
export interface TranslationData {
  country: string;
  names: {
    male: string[];
    female: string[];
    neutral: string[];
  };
  places: Record<string, string[]>;
  population: number;
  currencySymbol: string;
  rialToLocal: number;
}

/**
 * Result of translating a marker
 */
export interface MarkerTranslation {
  translated: string;
  original: string | null;
}

/**
 * Get the original Iranian value for a marker
 */
export function getOriginalValue(marker: Marker): string {
  // Check if marker has an explicit 'original' field
  if ('original' in marker && marker.original) {
    return marker.original as string;
  }

  // Generate default original based on marker type
  switch (marker.type) {
    case 'person':
      return (marker as PersonMarker).name || '[Iranian name]';
    case 'place':
      return (marker as PlaceMarker).original || '[Iranian location]';
    case 'number':
      return (marker as NumberMarker).base.toString();
    case 'currency': {
      const currencyMarker = marker as CurrencyMarker;
      return `${currencyMarker.base.toLocaleString()} Rial`;
    }
    case 'date':
    case 'time':
    case 'event':
      return marker.value as string;
    case 'occupation':
      return (marker as OccupationMarker).original || marker.category || '[original occupation]';
    case 'subject':
      return marker.category || '[original]';
    case 'source':
      // Sources don't have "originals" to show
      return '';
    case 'image':
      // Images don't have "originals" to show
      return '';
    default:
      return '[original value]';
  }
}

/**
 * Translate a single marker based on context
 * Returns both the translated value and the original value
 */
export function translateMarker(
  markerKey: string,
  marker: Marker,
  data: TranslationData,
  storyId: string
): MarkerTranslation {
  const seed = `${storyId}-${markerKey}-${data.country}`;

  switch (marker.type) {
    case 'person': {
      const personMarker = marker as PersonMarker;
      const nameList = data.names[personMarker.gender] || data.names.neutral;
      return {
        translated: selectFromArray(nameList, seed),
        original: personMarker.name || personMarker.original || null,
      };
    }

    case 'place': {
      const placeMarker = marker as PlaceMarker;
      let placeKey: string = placeMarker.category;

      // Build more specific key if size is provided
      if (placeMarker.size) {
        placeKey = `${placeMarker.category}-${placeMarker.size}`;
      }

      // For university and landmark-protest, use them directly
      if (placeMarker.category === 'university' || placeMarker.category === 'landmark') {
        if (
          placeMarker.category === 'landmark' &&
          placeMarker.significance === 'protest-location'
        ) {
          placeKey = 'landmark-protest';
        }
      }

      const placeList = data.places[placeKey] || data.places['city-medium'] || ['Unknown City'];
      return {
        translated: selectFromArray(placeList, seed),
        original: placeMarker.original || null,
      };
    }

    case 'number': {
      const numberMarker = marker as NumberMarker;
      let value = numberMarker.base;

      // Apply scaling if needed
      if (numberMarker.scale && numberMarker['scale-factor']) {
        const iranPopulation = 88550570; // Approximate Iran population
        const ratio = data.population / iranPopulation;
        const scaleFactor = numberMarker['scale-factor'];
        value = Math.round(value * ratio * scaleFactor);
      }

      // Apply variance if specified
      if (numberMarker.variance) {
        const seedValue = seededRandom(seed);
        const variance = numberMarker.variance;
        const adjustment = Math.floor((seedValue - 0.5) * 2 * variance);
        value += adjustment;
      }

      return {
        translated: value.toString(),
        original: numberMarker.base.toString(),
      };
    }

    case 'currency': {
      const currencyMarker = marker as CurrencyMarker;
      const converted = Math.round(currencyMarker.base * data.rialToLocal);
      const formatted = converted.toLocaleString('en-US');
      return {
        translated: `${data.currencySymbol}${formatted}`,
        original: `${currencyMarker.base.toLocaleString()} Rial`,
      };
    }

    case 'date':
    case 'time':
    case 'event': {
      const value = marker.translation || marker.value;
      return {
        translated: value as string,
        original: null, // Don't show strikethrough for dates/events
      };
    }

    case 'occupation': {
      const occupationMarker = marker as OccupationMarker;
      // If examples are provided, select one deterministically
      if (occupationMarker.examples && occupationMarker.examples.length > 0) {
        return {
          translated: selectFromArray(occupationMarker.examples, seed),
          original: occupationMarker.original || occupationMarker.category || null,
        };
      }
      // Fallback to original if provided, or category
      return {
        translated: occupationMarker.original || occupationMarker.category || 'worker',
        original: null,
      };
    }

    case 'subject': {
      if (marker.examples && marker.examples.length > 0) {
        return {
          translated: selectFromArray(marker.examples, seed),
          original: marker.category || null,
        };
      }
      return {
        translated: marker.category || 'studies',
        original: null,
      };
    }

    case 'source': {
      // Sources are handled specially in the UI
      return {
        translated: marker.text || '',
        original: null,
      };
    }

    case 'image': {
      // Images are handled specially in the UI
      return {
        translated: '',
        original: null,
      };
    }

    default:
      return {
        translated: `[${markerKey}]`,
        original: null,
      };
  }
}
