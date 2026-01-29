import { describe, it, expect } from 'vitest';
import { parsePreTranslated } from './pretranslated-parser';

describe('parsePreTranslated', () => {
  it('should parse {{source:id}} placeholders correctly', () => {
    const text = 'According to reports{{source:death-toll}}, something happened.';
    const segments = parsePreTranslated(text);

    const sourcePlaceholder = segments.find(s => s.isPlaceholder && s.type === 'source');
    expect(sourcePlaceholder).toBeDefined();
    expect(sourcePlaceholder?.type).toBe('source');
    expect(sourcePlaceholder?.key).toBe('death-toll');
    expect(sourcePlaceholder?.text).toBe('{{source:death-toll}}');
    expect(sourcePlaceholder?.isPlaceholder).toBe(true);
  });

  it('should parse {{image:id}} placeholders correctly', () => {
    const text = 'Here is an image: {{image:morgue-scene}} End of text.';
    const segments = parsePreTranslated(text);

    const imagePlaceholder = segments.find(s => s.isPlaceholder && s.type === 'image');
    expect(imagePlaceholder).toBeDefined();
    expect(imagePlaceholder?.type).toBe('image');
    expect(imagePlaceholder?.key).toBe('morgue-scene');
    expect(imagePlaceholder?.text).toBe('{{image:morgue-scene}}');
    expect(imagePlaceholder?.isPlaceholder).toBe(true);
  });

  it('should parse [[MARKER:...]] and {{placeholder}} together', () => {
    const text = '[[MARKER:person:student:Raha|Lina]] was shot{{source:report}}.';
    const segments = parsePreTranslated(text);

    const markerSegment = segments.find(s => s.type === 'person');
    expect(markerSegment).toBeDefined();
    expect(markerSegment?.text).toBe('Lina');
    expect(markerSegment?.original).toBe('Raha');

    const sourcePlaceholder = segments.find(s => s.isPlaceholder && s.type === 'source');
    expect(sourcePlaceholder).toBeDefined();
    expect(sourcePlaceholder?.type).toBe('source');
    expect(sourcePlaceholder?.key).toBe('report');
  });
});
