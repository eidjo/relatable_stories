import { describe, it } from 'vitest';
import { translateStory } from '$lib/translation/pipeline';
import { stories } from '$lib/data/stories';

describe('Story Rendering', () => {
  it('should check spacing in rendered story content', () => {
    const story = stories[0];

    const translated = translateStory({
      storySlug: story.slug,
      country: 'US',
      language: 'en',
      contextualizationEnabled: true,
    });

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
