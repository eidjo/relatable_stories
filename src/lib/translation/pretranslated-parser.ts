/**
 * Parser for pre-translated stories with [[MARKER:...]] format
 * These stories have already been translated with correct grammar/case
 */

import type { TranslatedSegment } from '$lib/types';

/**
 * Parse text containing [[MARKER:...]], [[COMPARISON:...]], and {{marker:key}} formats
 * [[MARKER:...]] are pre-translated with tooltips
 * [[COMPARISON:...]] are casualty comparisons with explanations
 * {{marker:key}} are kept as placeholders to be filled from original story
 */
export function parsePreTranslated(text: string): TranslatedSegment[] {
  const segments: TranslatedSegment[] = [];

  // Combined regex to match:
  // 1. [[MARKER:type:key:original|value]] or [[MARKER:type:key:original|value|explanation]]
  // 2. [[COMPARISON:original|translated|explanation]]
  // 3. {{type:key}}
  const combinedRegex =
    /(\[\[MARKER:([\w-]+):([\w-]+):([^|]+)\|([^|\]]+)(?:\|([^\]]+))?\]\])|(\[\[COMPARISON:([^|]+)\|([^|]+)\|([^\]]+)\]\])|(\{\{([\w-]+):([\w-]+)\}\})/g;

  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const startIndex = match.index;

    // Add text before marker
    if (startIndex > lastIndex) {
      const plainText = text.substring(lastIndex, startIndex);
      if (plainText) {
        segments.push({
          text: plainText,
          original: null,
          type: null,
          key: null,
        });
      }
    }

    if (match[1]) {
      // [[MARKER:type:key:original|value]] or [[MARKER:type:key:original|value|explanation]]
      const [, , type, key, original, value, explanation] = match;
      segments.push({
        text: value,
        original: original,
        type: type as any,
        key: key,
        explanation: explanation || undefined,
      });
    } else if (match[7]) {
      // [[COMPARISON:original|translated|explanation]] - casualty comparison
      const [, , , , , , , , , translated, comparisonExplanation] = match;
      segments.push({
        text: translated,
        original: null,
        type: 'comparison' as any,
        key: null,
        explanation: comparisonExplanation,
      });
    } else if (match[11]) {
      // {{type:key}} format - needs to be filled from original story
      const [, , , , , , , , , , , markerType, markerKey] = match;
      segments.push({
        text: match[0], // Keep the {{marker}} as placeholder
        original: null,
        type: markerType as any,
        key: markerKey,
        isPlaceholder: true, // Flag to indicate this needs processing
      } as any);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) {
      segments.push({
        text: remaining,
        original: null,
        type: null,
        key: null,
      });
    }
  }

  return segments;
}

/**
 * Parse text with paragraph breaks
 */
export function parsePreTranslatedWithParagraphs(text: string): TranslatedSegment[] {
  const paragraphs = text.split(/\n+/).filter((p) => p.trim());
  const allSegments: TranslatedSegment[] = [];

  paragraphs.forEach((paragraph, pIdx) => {
    const segments = parsePreTranslated(paragraph);
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
