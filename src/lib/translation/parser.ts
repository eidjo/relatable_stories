/**
 * Parser for template strings with markers like {{type:key}}
 */

export interface ParsedToken {
  type: 'text' | 'marker';
  value: string;
  markerType?: string;
  markerKey?: string;
}

const MARKER_REGEX = /\{\{([^:]+):([^}]+)\}\}/g;

/**
 * Parse a string containing markers into tokens
 * @param text - Text with markers like "{{name:person1}} went to {{place:city}}"
 * @returns Array of tokens representing text and markers
 */
export function parseText(text: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  let lastIndex = 0;

  // Find all markers
  const matches = text.matchAll(MARKER_REGEX);

  for (const match of matches) {
    const [fullMatch, markerType, markerKey] = match;
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
      markerType,
      markerKey,
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
 * Check if a string contains any markers
 */
export function hasMarkers(text: string): boolean {
  return MARKER_REGEX.test(text);
}
