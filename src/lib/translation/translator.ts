import { parseText } from './parser';
import { format } from 'date-fns';
import type {
  Story,
  TranslatedStory,
  TranslatedSegment,
  Marker,
  MarkerType,
  NumberMarker,
  CurrencyMarker,
  PersonMarker,
  PlaceMarker,
  SourceMarker,
  OccupationMarker,
  ImageMarker,
  TranslationContext,
} from '$lib/types';

/**
 * Deterministic random number generator (seeded)
 * Ensures same story + country always generates same names
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

/**
 * Select a name deterministically from an array
 */
function selectName(names: string[], seed: string): string {
  const index = Math.floor(seededRandom(seed) * names.length);
  return names[index];
}

/**
 * Get the original Iranian value for a marker
 */
function getOriginalValue(marker: Marker): string {
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
 */
function translateMarker(
  markerKey: string,
  marker: Marker,
  context: TranslationContext,
  storyId: string
): string {
  switch (marker.type) {
    case 'person': {
      const personMarker = marker as PersonMarker;
      const nameList = context.names[personMarker.gender] || context.names.neutral;
      const seed = `${storyId}-${markerKey}-${context.country}`;
      return selectName(nameList, seed);
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

      const placeList = context.places[placeKey] ||
        context.places['city-medium'] || ['Unknown City'];
      const seed = `${storyId}-${markerKey}-${context.country}`;
      return selectName(placeList, seed);
    }

    case 'number': {
      const numberMarker = marker as NumberMarker;
      let value = numberMarker.base;

      // Apply scaling if needed
      if (numberMarker.scale && numberMarker['scale-factor']) {
        const iranPopulation = 88550570; // Approximate Iran population
        const ratio = context.countryData.population / iranPopulation;
        const scaleFactor = numberMarker['scale-factor'];
        value = Math.round(value * ratio * scaleFactor);
      }

      // Apply variance if specified
      if (numberMarker.variance) {
        const seed = seededRandom(`${storyId}-${markerKey}-${context.country}`);
        const variance = numberMarker.variance;
        const adjustment = Math.floor((seed - 0.5) * 2 * variance);
        value += adjustment;
      }

      return value.toString();
    }

    case 'currency': {
      const currencyMarker = marker as CurrencyMarker;
      const converted = Math.round(currencyMarker.base * context.countryData['rial-to-local']);
      const symbol = context.countryData['currency-symbol'];

      // Format with thousand separators
      const formatted = converted.toLocaleString('en-US');
      return `${symbol}${formatted}`;
    }

    case 'date': {
      try {
        const date = new Date(marker.value as string);
        return format(date, 'MMMM d, yyyy');
      } catch {
        return marker.value as string;
      }
    }

    case 'time': {
      return marker.value as string;
    }

    case 'event': {
      return marker.translation || marker.value;
    }

    case 'occupation': {
      const occupationMarker = marker as OccupationMarker;
      // If examples are provided, select one deterministically
      if (occupationMarker.examples && occupationMarker.examples.length > 0) {
        const seed = `${storyId}-${markerKey}-${context.country}`;
        return selectName(occupationMarker.examples, seed);
      }
      // Fallback to original if provided, or category
      return occupationMarker.original || occupationMarker.category || 'worker';
    }

    case 'subject': {
      if (marker.examples && marker.examples.length > 0) {
        const seed = `${storyId}-${markerKey}-${context.country}`;
        return selectName(marker.examples, seed);
      }
      return marker.category || 'studies';
    }

    case 'source': {
      const sourceMarker = marker as SourceMarker;
      // Format as a superscript reference if number is provided
      if (sourceMarker.number) {
        return `[${sourceMarker.number}]`;
      }
      // Otherwise return inline citation in brackets
      return `[${sourceMarker.text}]`;
    }

    case 'image': {
      // Images will be handled specially in the UI, return empty string
      return '';
    }

    default:
      return `[${markerKey}]`;
  }
}

/**
 * Translate a text string with markers
 * Returns an array of segments, with paragraph breaks preserved as special segments
 */
export function translateText(
  text: string,
  markers: Record<string, Marker>,
  context: TranslationContext,
  storyId: string
): TranslatedSegment[] {
  // Split by newlines first to preserve paragraph structure
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  const allSegments: TranslatedSegment[] = [];

  paragraphs.forEach((paragraph, pIdx) => {
    const tokens = parseText(paragraph);
    const segments: TranslatedSegment[] = [];

    for (const token of tokens) {
      if (token.type === 'text') {
        segments.push({
          text: token.value,
          original: null,
          type: null,
          key: null,
        });
      } else if (token.type === 'marker' && token.markerKey) {
        const marker = markers[token.markerKey];
        if (marker) {
          const translated = translateMarker(token.markerKey, marker, context, storyId);
          const original = getOriginalValue(marker);

          // For source markers, include URL and title
          const segment: TranslatedSegment = {
            text: translated,
            original: original,
            type: (token.markerType as MarkerType) || null,
            key: token.markerKey,
          };

          if (marker.type === 'source') {
            const sourceMarker = marker as SourceMarker;
            if (sourceMarker.url) segment.url = sourceMarker.url;
            if (sourceMarker.title) segment.title = sourceMarker.title;
          } else if (marker.type === 'image') {
            const imageMarker = marker as ImageMarker;
            segment.src = imageMarker.src;
            segment.alt = imageMarker.alt;
            if (imageMarker.caption) segment.caption = imageMarker.caption;
            if (imageMarker.contentWarning) segment.contentWarning = imageMarker.contentWarning;
            if (imageMarker.credit) segment.credit = imageMarker.credit;
            if (imageMarker.creditUrl) segment.creditUrl = imageMarker.creditUrl;
          }

          segments.push(segment);
        } else {
          // Marker not found, keep original
          segments.push({
            text: token.value,
            original: null,
            type: null,
            key: null,
          });
        }
      }
    }

    // Add segments from this paragraph
    allSegments.push(...segments);

    // Add paragraph break marker (except after last paragraph)
    if (pIdx < paragraphs.length - 1) {
      allSegments.push({
        text: '\n\n',
        original: null,
        type: 'paragraph-break' as any,
        key: null,
      });
    }
  });

  return allSegments;
}

/**
 * Translate an entire story
 */
export function translateStory(story: Story, context: TranslationContext): TranslatedStory {
  return {
    id: story.id,
    title: translateText(story.title, story.markers, context, story.id),
    slug: story.slug,
    date: story.date,
    summary: translateText(story.summary, story.markers, context, story.id),
    content: translateText(story.content, story.markers, context, story.id),
    tags: story.tags,
    severity: story.severity,
    verified: story.verified,
    source: story.source,
    contentWarning: story['content-warning'],
    image: story.image,
    meta: story.meta,
  };
}
