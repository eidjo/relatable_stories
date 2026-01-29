/**
 * V2 Translator - Uses V2 marker system and parser
 */

import { parseText } from './parser';
import {
  translateMarkerV2,
  type TranslationDataV2,
  type TranslationContext,
  type ComparableEvent,
  type PlacesDataV2,
} from './core';
import { formatDateLocalized } from '$lib/utils/date-locale';
import type { Story, TranslatedStory, TranslatedSegment, Marker } from '$lib/types';
import type { SourceMarker, ImageMarker } from '$lib/types';
import { getMarkerType, isPersonMarker, isCasualtiesMarker, isSourceMarker, isImageMarker } from '$lib/types';

/**
 * Context from UI (stores) needs to be converted to V2 format
 */
export interface UITranslationContext {
  country: string;
  names: {
    male: string[];
    female: string[];
    neutral: string[];
  };
  places: any; // Will be loaded from places-v2.yaml
  countryData: {
    population: number;
    'currency-symbol': string;
    'rial-to-local': number;
  };
  comparableEvents?: ComparableEvent[];
}

/**
 * Convert UI context to V2 translation data
 */
function contextToData(context: UITranslationContext): TranslationDataV2 {
  return {
    country: context.country,
    names: context.names,
    places: context.places as PlacesDataV2,
    population: context.countryData.population,
    currencySymbol: context.countryData['currency-symbol'],
    rialToLocal: context.countryData['rial-to-local'],
    comparableEvents: context.comparableEvents,
  };
}

/**
 * Translate a text string with V2 markers
 */
export function translateText(
  text: string,
  markers: Record<string, Marker>,
  context: UITranslationContext,
  storyId: string,
  languageCode: string = 'en',
  sources?: import('$lib/types').SourceReference[],
  images?: import('$lib/types').ImageReference[]
): TranslatedSegment[] {
  const data = contextToData(context);
  const translationContext: TranslationContext = {
    markers,
    resolved: new Map(),
    storyId,
  };

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
        // Special handling for source and image references
        if (token.markerKey === 'source' && token.suffix && sources) {
          // {{source:id}} pattern - lookup in sources array
          const source = sources.find(s => s.id === token.suffix);
          if (source) {
            segments.push({
              text: `[${source.number}]`,
              original: null,
              type: 'source' as any,
              key: token.suffix,
              url: source.url,
              title: source.title,
            });
          } else {
            segments.push({
              text: `[source:${token.suffix}]`,
              original: null,
              type: null,
              key: null,
            });
          }
          continue;
        }

        if (token.markerKey === 'image' && token.suffix && images) {
          // {{image:id}} pattern - lookup in images array
          const image = images.find(img => img.id === token.suffix);
          if (image) {
            segments.push({
              text: '',
              original: null,
              type: 'image' as any,
              key: token.suffix,
              src: image.src,
              alt: image.alt,
              caption: image.caption,
              contentWarning: image.contentWarning,
              credit: image.credit,
              creditUrl: image.creditUrl,
            });
          } else {
            segments.push({
              text: `[image:${token.suffix}]`,
              original: null,
              type: null,
              key: null,
            });
          }
          continue;
        }

        const marker = markers[token.markerKey];
        if (!marker) {
          // Marker not found
          segments.push({
            text: `[${token.markerKey}]`,
            original: null,
            type: null,
            key: null,
          });
          continue;
        }

        const markerType = getMarkerType(marker);

        // Handle suffixes
        if (token.suffix) {
          if (token.suffix === 'age' && isPersonMarker(marker) && marker.age) {
            // Access property: {{student:age}}
            segments.push({
              text: marker.age.toString(),
              original: null,
              type: null,
              key: token.markerKey,
            });
            continue;
          } else if (token.suffix === 'comparable' && isCasualtiesMarker(marker)) {
            // Show comparison: {{killed:comparable}}
            if (!translationContext.resolved.has(token.markerKey)) {
              const result = translateMarkerV2(token.markerKey, marker, data, translationContext);
              translationContext.resolved.set(token.markerKey, result);
            }
            const result = translationContext.resolved.get(token.markerKey)!;
            if (result.comparison) {
              segments.push({
                text: `- ${result.comparison} -`,
                original: null,
                type: null,
                key: token.markerKey,
              });
            }
            continue;
          } else if (token.suffix === 'original') {
            // Show only original
            if (!translationContext.resolved.has(token.markerKey)) {
              const result = translateMarkerV2(token.markerKey, marker, data, translationContext);
              translationContext.resolved.set(token.markerKey, result);
            }
            const result = translationContext.resolved.get(token.markerKey)!;
            segments.push({
              text: result.original || result.value,
              original: null,
              type: null,
              key: token.markerKey,
            });
            continue;
          } else if (token.suffix === 'translated') {
            // Show only translated (no strikethrough)
            if (!translationContext.resolved.has(token.markerKey)) {
              const result = translateMarkerV2(token.markerKey, marker, data, translationContext);
              translationContext.resolved.set(token.markerKey, result);
            }
            const result = translationContext.resolved.get(token.markerKey)!;
            segments.push({
              text: result.value,
              original: null,
              type: null,
              key: token.markerKey,
            });
            continue;
          }
        }

        // Standard translation

        // Special handling for dates
        if (markerType === 'date') {
          const dateValue = (marker as any).date;
          let formatted = dateValue;
          try {
            if (context.country !== 'IR') {
              formatted = formatDateLocalized(dateValue, languageCode);
            }
          } catch {
            // Keep original if formatting fails
          }
          segments.push({
            text: formatted,
            original: null,
            type: 'date' as any,
            key: token.markerKey,
          });
          continue;
        }

        // Backwards compatibility: old source/image markers in markers object
        // (New stories should use sources/images arrays instead)
        if (isSourceMarker(marker)) {
          const sourceMarker = marker as SourceMarker;
          const segment: TranslatedSegment = {
            text: sourceMarker.number ? `[${sourceMarker.number}]` : `[${sourceMarker.text}]`,
            original: null,
            type: 'source' as any,
            key: token.markerKey,
          };
          if (sourceMarker.url) segment.url = sourceMarker.url;
          if (sourceMarker.title) segment.title = sourceMarker.title;
          segments.push(segment);
          continue;
        }

        if (isImageMarker(marker)) {
          const imageMarker = marker as ImageMarker;
          const segment: TranslatedSegment = {
            text: '',
            original: null,
            type: 'image' as any,
            key: token.markerKey,
            src: imageMarker.src,
            alt: imageMarker.alt,
          };
          if (imageMarker.caption) segment.caption = imageMarker.caption;
          if (imageMarker.contentWarning) segment.contentWarning = imageMarker.contentWarning;
          if (imageMarker.credit) segment.credit = imageMarker.credit;
          if (imageMarker.creditUrl) segment.creditUrl = imageMarker.creditUrl;
          segments.push(segment);
          continue;
        }

        // Use core translation for all other types
        if (!translationContext.resolved.has(token.markerKey)) {
          const result = translateMarkerV2(token.markerKey, marker, data, translationContext);
          translationContext.resolved.set(token.markerKey, result);
        }

        const result = translationContext.resolved.get(token.markerKey)!;
        segments.push({
          text: result.value,
          original: result.original,
          type: markerType as any,
          key: token.markerKey,
        });
      }
    }

    // Add segments from this paragraph
    allSegments.push(...segments);

    // Add paragraph break (except after last paragraph)
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
 * Translate an entire story with V2 system
 */
export function translateStory(
  story: Story,
  context: UITranslationContext,
  languageCode: string = 'en'
): TranslatedStory {
  return {
    id: story.id,
    title: translateText(story.title, story.markers, context, story.id, languageCode, story.sources, story.images),
    slug: story.slug,
    date: story.date,
    summary: translateText(story.summary, story.markers, context, story.id, languageCode, story.sources, story.images),
    content: translateText(story.content, story.markers, context, story.id, languageCode, story.sources, story.images),
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
