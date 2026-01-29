/**
 * V2 Translation Pipeline
 *
 * Separates translation business logic from rendering.
 * Produces normalized segment structure that can be rendered to any target.
 */

import { load as yamlLoad } from 'js-yaml';
import { translateMarkerV2 } from './core';
import type { TranslationDataV2, TranslationContext } from './core';
import type { Story, Marker } from '$lib/types';
import { getMarkerType, isSourceMarker, isImageMarker } from '$lib/types';
import { parseText } from './parser';
import { formatDateLocalized } from '$lib/utils/date-locale';

// Import YAML files directly (works in browser via Vite)
import countriesYaml from '$lib/data/contexts/countries.yaml?raw';
import namesYaml from '$lib/data/contexts/names.yaml?raw';
import placesYaml from '$lib/data/contexts/places.yaml?raw';
import comparableEventsYaml from '$lib/data/contexts/comparable-events.yaml?raw';

// Dynamically import all story files
const storyFiles = import.meta.glob('$lib/data/stories/*/story.yaml', {
  query: '?raw',
  eager: true,
  import: 'default'
}) as Record<string, string>;

// Dynamically import all pre-translated stories
const preTranslatedFiles = import.meta.glob('$lib/data/stories/*/story.*.yaml', {
  query: '?raw',
  eager: true,
  import: 'default'
}) as Record<string, string>;

// Parse YAML once at module load (not on every function call!)
const PARSED_COUNTRIES = (yamlLoad(countriesYaml) as any).countries;
const PARSED_NAMES = yamlLoad(namesYaml) as any;
const PARSED_PLACES = yamlLoad(placesYaml) as any;
const PARSED_COMPARABLE_EVENTS = yamlLoad(comparableEventsYaml) as any;

// Build story map from imported files
const STORY_DATA: Record<string, string> = {};
for (const [path, content] of Object.entries(storyFiles)) {
  // Extract slug from path: /src/lib/data/stories/mahsa-arrest/story.yaml -> mahsa-arrest
  const match = path.match(/stories\/([^/]+)\/story\.yaml$/);
  if (match) {
    STORY_DATA[match[1]] = content;
  }
}

// Build pre-translated story map
const PRETRANSLATED_STORIES: Record<string, string> = {};
for (const [path, content] of Object.entries(preTranslatedFiles)) {
  // Extract slug and locale: /src/lib/data/stories/mahsa-arrest/story.fr-be.yaml -> mahsa-arrest:fr-be
  const match = path.match(/stories\/([^/]+)\/story\.([a-z]{2}-[a-z]{2})\.yaml$/);
  if (match) {
    PRETRANSLATED_STORIES[`${match[1]}:${match[2]}`] = content;
  }
}

// Cache parsed stories
const PARSED_STORIES: Record<string, Story> = {};
const PARSED_PRETRANSLATED: Record<string, Story> = {};

// ============================================================================
// Type Definitions
// ============================================================================

export interface TranslationInput {
  storySlug: string;
  country: string;
  language: string;
  contextualizationEnabled: boolean;
  preferredTranslationSource?: 'pre-translated' | 'runtime' | 'auto'; // default: 'auto'
}

export interface NormalizedSegment {
  text: string;
  original?: string;
  tooltip?: string;
  type: 'text' | 'person' | 'place' | 'number' | 'date' | 'source' | 'image' | 'comparison' | 'paragraph-break' | 'casualties';
  style?: 'strikethrough-muted' | 'bold-primary' | 'italic-comparison';
  metadata?: {
    url?: string;           // For sources
    src?: string;           // For images
    alt?: string;           // For images
    caption?: string;       // For images
    contentWarning?: string; // For images
    credit?: string;        // For images
    creditUrl?: string;     // For images
    explanation?: string;   // For tooltips
    [key: string]: any;
  };
}

export interface TranslatedStoryOutput {
  id: string;
  slug: string;
  title: NormalizedSegment[];
  summary: NormalizedSegment[];
  content: NormalizedSegment[];
  metadata: {
    country: string;
    language: string;
    contextualized: boolean;
    translationSource: 'pre-translated' | 'runtime';
  };
  // Preserve original story metadata
  date: string;
  tags: string[];
  hashtags?: string; // String format (e.g., "#tag1 #tag2"), not array
  severity?: string;
  verified?: boolean;
  source?: string;
  contentWarning?: string;
}

interface Context {
  data: TranslationDataV2;
  translationContext: TranslationContext;
}

// ============================================================================
// Main Pipeline Function
// ============================================================================

export function translateStory(input: TranslationInput): TranslatedStoryOutput {
  // 1. Load original story (always needed for markers)
  const originalStory = loadOriginalStory(input.storySlug);

  // 2. Try to load pre-translated version
  const preTranslatedStory = loadPreTranslatedStory(
    input.storySlug,
    input.language,
    input.country
  );

  // 3. Load context data (needed for runtime translation fallback)
  const context = loadContextForCountry(input.country, input.language, originalStory.id, originalStory.markers || {});

  // 4. Decide which path to use
  const usePreTranslated =
    preTranslatedStory !== null &&
    (input.preferredTranslationSource !== 'runtime');

  const isPreTranslated = usePreTranslated;

  // 5. Translate all text fields
  const title = isPreTranslated
    ? parsePreTranslatedText(
        preTranslatedStory!.title,
        originalStory.markers,
        context,
        input,
        originalStory.sources,
        originalStory.images
      )
    : translateRuntimeText(
        originalStory.title,
        originalStory.markers,
        context,
        input,
        originalStory.sources,
        originalStory.images
      );

  const summary = isPreTranslated
    ? parsePreTranslatedText(
        preTranslatedStory!.summary,
        originalStory.markers,
        context,
        input,
        originalStory.sources,
        originalStory.images
      )
    : translateRuntimeText(
        originalStory.summary,
        originalStory.markers,
        context,
        input,
        originalStory.sources,
        originalStory.images
      );

  const content = isPreTranslated
    ? parsePreTranslatedText(
        preTranslatedStory!.content,
        originalStory.markers,
        context,
        input,
        originalStory.sources,
        originalStory.images
      )
    : translateRuntimeText(
        originalStory.content,
        originalStory.markers,
        context,
        input,
        originalStory.sources,
        originalStory.images
      );

  return {
    id: originalStory.id,
    slug: originalStory.slug,
    title,
    summary,
    content,
    metadata: {
      country: input.country,
      language: input.language,
      contextualized: input.contextualizationEnabled,
      translationSource: isPreTranslated ? 'pre-translated' : 'runtime',
    },
    // Preserve original metadata
    date: originalStory.date,
    tags: originalStory.tags,
    hashtags: originalStory.hashtags,
    severity: originalStory.severity,
    verified: originalStory.verified,
    source: originalStory.source,
    contentWarning: originalStory['content-warning'],
  };
}

// ============================================================================
// Path 1: Pre-Translated Stories
// ============================================================================

/**
 * Parse pre-translated text with [[MARKER:...]] and [[COMPARISON:...]] formats
 * Also handles {{placeholder}} markers that need runtime translation
 */
function parsePreTranslatedText(
  text: string,
  markers: Record<string, Marker>,
  context: Context,
  input: TranslationInput,
  sources?: Array<{ id: string; url: string; title: string; number: number }>,
  images?: Array<{ id: string; src: string; alt: string; caption?: string; contentWarning?: string; credit?: string; creditUrl?: string }>
): NormalizedSegment[] {
  const segments: NormalizedSegment[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());

  paragraphs.forEach((paragraph, pIdx) => {
    // Combined regex for:
    // 1. [[MARKER:type:key:original|value|explanation]]
    // 2. [[COMPARISON:original|translated|explanation]]
    // 3. {{{{key:suffix}}:type}} (escaped format from translation)
    // 4. {{key}} or {{key:suffix}} (placeholders)
    const regex = /(\[\[MARKER:([^:]+):([^:]+):([^|]+)\|([^|\]]+)(?:\|([^\]]+))?\]\])|(\[\[COMPARISON:([^|]+)\|([^|]+)\|([^\]]+)\]\])|(\{\{\{\{([^:}]+):([^}]+)\}\}:([^}]+)\}\})|(\{\{([^:}]+)(?::([^}]+))?\}\})/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(paragraph)) !== null) {
      // Add text before marker
      if (match.index > lastIndex) {
        const plainText = paragraph.substring(lastIndex, match.index);
        if (plainText) {
          segments.push({
            text: plainText,
            type: 'text',
          });
        }
      }

      if (match[1]) {
        // [[MARKER:type:key:original|value|explanation]]
        const [, , type, key, original, value, explanation] = match;

        segments.push({
          text: value,
          original: original,
          tooltip: explanation || (input.contextualizationEnabled ? `Original: ${original}` : undefined),
          type: type as any,
          style: 'strikethrough-muted',
        });

      } else if (match[7]) {
        // [[COMPARISON:original|translated|explanation]]
        const [, , , , , , , , original, translated, explanation] = match;

        segments.push({
          text: translated,
          tooltip: explanation,
          type: 'comparison',
          style: 'italic-comparison',
          metadata: { original },
        });

      } else if (match[11]) {
        // {{{{key:suffix}}:type}} - escaped format from translation
        const key = match[12];
        const suffix = match[13];
        const type = match[14];

        // Handle special keys (source and image)
        if (type === 'source' && sources) {
          const source = sources.find(s => s.id === suffix);
          if (source) {
            segments.push({
              text: `[${source.number}]`,
              type: 'source',
              style: 'bold-primary',
              metadata: {
                url: source.url,
                title: source.title,
              },
            });
          }
        } else if (type === 'image' && images) {
          const image = images.find(img => img.id === suffix);
          if (image) {
            segments.push({
              text: '',
              type: 'image',
              metadata: {
                src: image.src,
                alt: image.alt,
                caption: image.caption,
                contentWarning: image.contentWarning,
                credit: image.credit,
                creditUrl: image.creditUrl,
              },
            });
          }
        }

      } else if (match[15]) {
        // {{key}} or {{key:suffix}} - placeholder that needs runtime translation
        const key = match[16];
        const suffix = match[17];

        // Handle special keys
        if (key === 'source' && suffix && sources) {
          const source = sources.find(s => s.id === suffix);
          if (source) {
            segments.push({
              text: `[${source.number}]`,
              type: 'source',
              style: 'bold-primary',
              metadata: {
                url: source.url,
                title: source.title,
              },
            });
          }
        } else if (key === 'image' && suffix && images) {
          const image = images.find(img => img.id === suffix);
          if (image) {
            segments.push({
              text: '',
              type: 'image',
              metadata: {
                src: image.src,
                alt: image.alt,
                caption: image.caption,
                contentWarning: image.contentWarning,
                credit: image.credit,
                creditUrl: image.creditUrl,
              },
            });
          }
        } else {
          // Regular marker - do runtime translation
          const marker = markers[key];
          if (marker) {
            const runtimeSegment = translateSingleMarker(key, suffix, marker, context, input);
            segments.push(runtimeSegment);
          } else {
            // Marker not found
            segments.push({
              text: `{{${key}${suffix ? ':' + suffix : ''}}}`,
              type: 'text',
            });
          }
        }
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < paragraph.length) {
      const remaining = paragraph.substring(lastIndex);
      if (remaining) {
        segments.push({
          text: remaining,
          type: 'text',
        });
      }
    }

    // Add paragraph break (except after last paragraph)
    if (pIdx < paragraphs.length - 1) {
      segments.push({
        text: '\n\n',
        type: 'paragraph-break',
      });
    }
  });

  return segments;
}

// ============================================================================
// Path 2: Runtime Translation
// ============================================================================

/**
 * Runtime translation for stories without pre-translated version
 * Parses {{markers}} and translates using core V2 engine
 */
function translateRuntimeText(
  text: string,
  markers: Record<string, Marker>,
  context: Context,
  input: TranslationInput,
  sources?: Array<{ id: string; url: string; title: string; number: number }>,
  images?: Array<{ id: string; src: string; alt: string; caption?: string; contentWarning?: string; credit?: string; creditUrl?: string }>
): NormalizedSegment[] {
  const segments: NormalizedSegment[] = [];

  // Split by paragraphs
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());

  paragraphs.forEach((paragraph, pIdx) => {
    const tokens = parseText(paragraph);

    for (const token of tokens) {
      if (token.type === 'text') {
        segments.push({
          text: token.value,
          type: 'text',
        });

      } else if (token.type === 'marker' && token.markerKey) {
        // Handle special marker references
        if (token.markerKey === 'source' && token.suffix && sources) {
          const source = sources.find(s => s.id === token.suffix);
          if (source) {
            segments.push({
              text: `[${source.number}]`,
              tooltip: source.title,
              type: 'source',
              style: 'bold-primary',
              metadata: {
                url: source.url,
              },
            });
          }
          continue;
        }

        if (token.markerKey === 'image' && token.suffix && images) {
          const image = images.find(img => img.id === token.suffix);
          if (image) {
            segments.push({
              text: '',
              type: 'image',
              metadata: {
                src: image.src,
                alt: image.alt,
                caption: image.caption,
                contentWarning: image.contentWarning,
                credit: image.credit,
                creditUrl: image.creditUrl,
              },
            });
          }
          continue;
        }

        // Regular marker
        const marker = markers[token.markerKey];
        if (!marker) {
          segments.push({
            text: `{{${token.markerKey}}}`,
            type: 'text',
          });
          continue;
        }

        // Translate marker
        const segment = translateSingleMarker(
          token.markerKey,
          token.suffix,
          marker,
          context,
          input
        );
        segments.push(segment);
      }
    }

    // Add paragraph break
    if (pIdx < paragraphs.length - 1) {
      segments.push({
        text: '\n\n',
        type: 'paragraph-break',
      });
    }
  });

  return segments;
}

/**
 * Translate a single marker to a normalized segment
 */
function translateSingleMarker(
  key: string,
  suffix: string | undefined,
  marker: Marker,
  context: Context,
  input: TranslationInput
): NormalizedSegment {
  const markerType = getMarkerType(marker);

  // Handle suffixes
  if (suffix === 'age' && 'age' in marker) {
    return {
      text: (marker as any).age.toString(),
      type: 'text',
    };
  }

  if (suffix === 'comparable' && 'casualties' in marker) {
    // Get comparison from translateMarkerV2
    const result = translateMarkerV2(key, marker, context.data, context.translationContext);
    if (result.comparison) {
      return {
        text: result.comparison,
        tooltip: result.comparisonExplanation,
        type: 'comparison',
        style: 'italic-comparison',
      };
    }
    // No comparison available - return empty text to avoid duplicating the number
    return {
      text: '',
      type: 'text',
    };
  }

  if (suffix === 'original') {
    const result = translateMarkerV2(key, marker, context.data, context.translationContext);
    return {
      text: result.original || result.value,
      type: 'text',
    };
  }

  if (suffix === 'translated') {
    const result = translateMarkerV2(key, marker, context.data, context.translationContext);
    return {
      text: result.value,
      type: 'text',
    };
  }

  // Handle dates specially
  if (markerType === 'date') {
    const dateValue = (marker as any).date;
    let formatted = dateValue;
    try {
      formatted = formatDateLocalized(dateValue, input.language);
    } catch {
      // Keep original if formatting fails
    }
    return {
      text: formatted,
      type: 'date',
    };
  }

  // Backwards compatibility: old source/image markers
  if (isSourceMarker(marker)) {
    const sourceMarker = marker as any;
    return {
      text: sourceMarker.number ? `[${sourceMarker.number}]` : `[${sourceMarker.text}]`,
      tooltip: sourceMarker.title,
      type: 'source',
      style: 'bold-primary',
      metadata: {
        url: sourceMarker.url,
      },
    };
  }

  if (isImageMarker(marker)) {
    const imageMarker = marker as any;
    return {
      text: '',
      type: 'image',
      metadata: {
        src: imageMarker.src,
        alt: imageMarker.alt,
        caption: imageMarker.caption,
        contentWarning: imageMarker.contentWarning,
        credit: imageMarker.credit,
        creditUrl: imageMarker.creditUrl,
      },
    };
  }

  // Use core translation for all other types
  const result = translateMarkerV2(key, marker, context.data, context.translationContext);

  return {
    text: result.value,
    original: result.original || undefined, // Convert null to undefined
    tooltip: result.explanation || (result.original && input.contextualizationEnabled ? `Original: ${result.original}` : undefined),
    type: markerType as any,
    style: result.original ? 'strikethrough-muted' : undefined,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load original story from story.yaml
 * Uses cache to avoid re-parsing YAML on every call
 */
function loadOriginalStory(storySlug: string): Story {
  // Check cache first
  if (PARSED_STORIES[storySlug]) {
    return PARSED_STORIES[storySlug];
  }

  // Parse and cache
  const storyYaml = STORY_DATA[storySlug];
  if (!storyYaml) {
    throw new Error(`Story not found: ${storySlug}`);
  }
  const parsed = yamlLoad(storyYaml) as Story;
  PARSED_STORIES[storySlug] = parsed;
  return parsed;
}

/**
 * Try to load pre-translated story, return null if doesn't exist
 */
function loadPreTranslatedStory(
  storySlug: string,
  language: string,
  country: string
): Story | null {
  // Construct key: story-slug:lang-country (e.g., "mahsa-arrest:fr-be")
  const key = `${storySlug}:${language}-${country.toLowerCase()}`;

  // Check cache first
  if (PARSED_PRETRANSLATED[key]) {
    return PARSED_PRETRANSLATED[key];
  }

  // Check if pre-translated version exists
  const yamlContent = PRETRANSLATED_STORIES[key];
  if (!yamlContent) {
    return null;
  }

  // Parse and cache
  const parsed = yamlLoad(yamlContent) as Story;
  PARSED_PRETRANSLATED[key] = parsed;
  return parsed;
}

/**
 * Load context data for country and prepare translation context
 * Uses pre-parsed YAML data for performance
 */
function loadContextForCountry(
  countryCode: string,
  languageCode: string,
  storyId: string,
  storyMarkers: Record<string, any> = {}
): Context {
  // Use pre-parsed data (parsed once at module load)
  const targetCountry = PARSED_COUNTRIES.find((c: any) => c.code === countryCode);
  const countryNames = PARSED_NAMES[countryCode] || PARSED_NAMES['US'];
  const countryPlaces = PARSED_PLACES[countryCode] || PARSED_PLACES['US'];
  const countryEvents = PARSED_COMPARABLE_EVENTS[countryCode] || [];

  const translationData: TranslationDataV2 = {
    country: countryCode,
    names: countryNames,
    places: countryPlaces,
    population: targetCountry?.population || 85000000,
    currencySymbol: targetCountry?.['currency-symbol'] || '$',
    rialToLocal: targetCountry?.['rial-to-local'] || 0.000024,
    comparableEvents: countryEvents,
    languageCode: languageCode,
  };

  const translationContext: TranslationContext = {
    markers: storyMarkers,
    resolved: new Map(),
    storyId: storyId,
  };

  return {
    data: translationData,
    translationContext,
  };
}
