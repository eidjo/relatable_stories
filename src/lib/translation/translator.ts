import { parseText } from './parser';
import { translateMarker, getOriginalValue, type TranslationData } from './core';
import { formatDateLocalized } from '$lib/utils/date-locale';
import type {
  Story,
  TranslatedStory,
  TranslatedSegment,
  Marker,
  MarkerType,
  SourceMarker,
  ImageMarker,
  TranslationContext,
} from '$lib/types';

/**
 * Convert TranslationContext to TranslationData format for core functions
 */
function contextToData(context: TranslationContext): TranslationData {
  return {
    country: context.country,
    names: context.names,
    places: context.places,
    population: context.countryData.population,
    currencySymbol: context.countryData['currency-symbol'],
    rialToLocal: context.countryData['rial-to-local'],
  };
}

/**
 * Translate a marker and format it for the UI
 * Handles special cases like dates, sources, and images
 */
function translateMarkerForUI(
  markerKey: string,
  marker: Marker,
  context: TranslationContext,
  storyId: string,
  languageCode: string = 'en'
): string {
  // Special cases that need UI-specific formatting
  switch (marker.type) {
    case 'date': {
      try {
        // For Iran, keep the original date format
        if (context.country.code === 'IR') {
          return marker.value as string;
        }
        return formatDateLocalized(marker.value as string, languageCode);
      } catch {
        return marker.value as string;
      }
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

    default: {
      // Use core translation function for all other types
      const data = contextToData(context);
      const result = translateMarker(markerKey, marker, data, storyId);
      return result.translated;
    }
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
  storyId: string,
  languageCode: string = 'en'
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
          const translated = translateMarkerForUI(token.markerKey, marker, context, storyId, languageCode);
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
export function translateStory(
  story: Story,
  context: TranslationContext,
  languageCode: string = 'en'
): TranslatedStory {
  return {
    id: story.id,
    title: translateText(story.title, story.markers, context, story.id, languageCode),
    slug: story.slug,
    date: story.date,
    summary: translateText(story.summary, story.markers, context, story.id, languageCode),
    content: translateText(story.content, story.markers, context, story.id, languageCode),
    tags: story.tags,
    hashtags: story.hashtags,
    severity: story.severity,
    verified: story.verified,
    source: story.source,
    contentWarning: story['content-warning'],
    image: story.image,
    meta: story.meta,
  };
}
