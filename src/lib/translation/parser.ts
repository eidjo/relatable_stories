/**
 * V2 Parser for template strings with markers
 *
 * Supports:
 * - {{marker}} - Standard reference
 * - {{marker:suffix}} - With modifier (comparable, age, original, translated, etc.)
 */

export interface ParsedToken {
  type: 'text' | 'marker';
  value: string;
  markerKey?: string;
  suffix?: string;  // Optional modifier: 'comparable', 'age', 'original', 'translated'
}

// V2 regex: matches {{key}} or {{key:suffix}}
const MARKER_REGEX = /\{\{([^:}]+)(?::([^}]+))?\}\}/g;

/**
 * Parse V2 marker syntax
 * @param text - Text with markers like "{{student}} went to {{city}}" or "{{killed:comparable}}"
 * @returns Array of tokens
 */
export function parseText(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  let lastIndex = 0;

  // Find all markers
  const matches = text.matchAll(MARKER_REGEX);

  for (const match of matches) {
    const [fullMatch, markerKey, suffix] = match;
    const matchIndex = match.index!;

    // Add any text before this marker
    if (matchIndex > lastIndex) {
      tokens.push({
        type: 'text',
        value: text.substring(lastIndex, matchIndex),
      });
    }

    // Add the marker token
    tokens.push({
      type: 'marker',
      value: fullMatch,
      markerKey,
      suffix: suffix || undefined,
    });

    lastIndex = matchIndex + fullMatch.length;
  }

  // Add any remaining text after the last marker
  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      value: text.substring(lastIndex),
    });
  }

  // If no markers found, return the whole text as a single token
  if (tokens.length === 0) {
    tokens.push({
      type: 'text',
      value: text,
    });
  }

  return tokens;
}

/**
 * Check if a string contains any V2 markers
 */
export function hasMarkers(text: string): boolean {
  return MARKER_REGEX.test(text);
}
