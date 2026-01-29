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
    /(?<marker>\[\[MARKER:(?<mType>[\w-]+):(?<mKey>[\w-]+):(?<mOriginal>[^|]+)\|(?<mValue>[^|\]]+)(?:\|(?<mExplanation>[^\]]+))?\]\])|(?<comparison>\[\[COMPARISON:(?<cOriginal>[^|]+)\|(?<cTranslated>[^|]+)\|(?<cExplanation>[^\]]+)\]\])|(?<placeholder>\{\{(?<pType>[\w-]+):(?<pKey>[\w-]+)\}\})/g;

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

    const groups = match.groups!;

    if (groups.marker) {
      // [[MARKER:type:key:original|value]] or [[MARKER:type:key:original|value|explanation]]
      segments.push({
        text: groups.mValue,
        original: groups.mOriginal,
        type: groups.mType as any,
        key: groups.mKey,
        explanation: groups.mExplanation || undefined,
      });
    } else if (groups.comparison) {
      // [[COMPARISON:original|translated|explanation]] - casualty comparison
      segments.push({
        text: groups.cTranslated,
        original: null,
        type: 'comparison' as any,
        key: null,
        explanation: groups.cExplanation,
      });
    } else if (groups.placeholder) {
      // {{type:key}} format - needs to be filled from original story
      segments.push({
        text: match[0], // Keep the {{marker}} as placeholder
        original: null,
        type: groups.pType,
        key: groups.pKey,
        isPlaceholder: true, // Flag to indicate this needs processing
      });
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
