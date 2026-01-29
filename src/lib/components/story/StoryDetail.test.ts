import { describe, it, expect } from 'vitest';
import { translateStory } from '$lib/translation/translator';
import { stories } from '$lib/data/stories';
import { getCountryByCode, getCountryNames, getCountryPlacesV2, getCountryComparableEvents } from '$lib/data/contexts';

describe('Story Rendering', () => {
  it('should check spacing in rendered story content', () => {
    const story = stories[0];
    const countryCode = 'US';
    const country = getCountryByCode(countryCode)!;

    const context = {
      country: countryCode,
      countryData: {
        population: country.population,
        'currency-symbol': country['currency-symbol'],
        'rial-to-local': country['rial-to-local'],
      },
      names: getCountryNames(countryCode),
      places: getCountryPlacesV2(countryCode),
      comparableEvents: getCountryComparableEvents(countryCode),
    };

    const translated = translateStory(story, context);

    // Log the first few segments to inspect spacing
    console.log('\n=== First 20 content segments ===');
    translated.content.slice(0, 20).forEach((segment, idx) => {
      console.log(`[${idx}] type="${segment.type}" text="${segment.text}"`);
    });

    // Check for spacing issues
    const contentText = translated.content.map((s) => s.text).join('');
    console.log('\n=== Raw concatenated text (first 200 chars) ===');
    console.log(contentText.substring(0, 200));

    // Check if any translated segments have trailing/leading spaces
    const segmentsWithSpaces = translated.content.filter(
      (s) =>
        s.type !== null &&
        (s.type as any) !== 'paragraph-break' &&
        (s.text.startsWith(' ') || s.text.endsWith(' '))
    );

    console.log('\n=== Translated segments with spaces ===');
    segmentsWithSpaces.forEach((s) => {
      console.log(
        `type="${s.type}" text="${s.text}" (starts=${s.text.startsWith(' ')}, ends=${s.text.endsWith(' ')})`
      );
    });
  });
});
