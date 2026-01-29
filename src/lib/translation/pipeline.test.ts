/**
 * Tests for Translation Pipeline
 */

import { describe, it, expect } from 'vitest';
import { translateStory } from './pipeline';

describe('Translation Pipeline', () => {
  describe('Pre-translated stories', () => {
    it('should load and parse Czech translation', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'CZ',
        language: 'cs',
        contextualizationEnabled: true,
      });

      expect(result.id).toBe('raha-2026');
      expect(result.metadata.translationSource).toBe('pre-translated');
      expect(result.metadata.country).toBe('CZ');
      expect(result.metadata.language).toBe('cs');

      // Check that title has segments
      expect(result.title.length).toBeGreaterThan(0);

      // Find the person segment
      const personSegment = result.title.find(s => s.type === 'person');
      expect(personSegment).toBeDefined();
      expect(personSegment?.text).toBe('Karolíny');
      expect(personSegment?.original).toBe('Rahy');
      expect(personSegment?.style).toBe('strikethrough-muted');
    });

    it('should load French translation', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'FR',
        language: 'fr',
        contextualizationEnabled: true,
      });

      expect(result.metadata.translationSource).toBe('pre-translated');
      expect(result.title.length).toBeGreaterThan(0);
    });
  });

  describe('Runtime translation', () => {
    it('should translate English to Greek context', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'GR',
        language: 'en',
        contextualizationEnabled: true,
      });

      expect(result.id).toBe('raha-2026');
      expect(result.metadata.translationSource).toBe('runtime');
      expect(result.metadata.country).toBe('GR');
      expect(result.metadata.language).toBe('en');

      // Find the person segment
      const personSegment = result.title.find(s => s.type === 'person');
      expect(personSegment).toBeDefined();
      expect(personSegment?.text).toBe('Aikaterini'); // Greek name
      expect(personSegment?.original).toBe('Raha');
      expect(personSegment?.style).toBe('strikethrough-muted');
    });

    it('should translate English to US context', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      expect(result.metadata.translationSource).toBe('runtime');

      // Find the person segment
      const personSegment = result.title.find(s => s.type === 'person');
      expect(personSegment).toBeDefined();
      expect(personSegment?.text).toBe('Olivia'); // American name
      expect(personSegment?.original).toBe('Raha');
    });
  });

  describe('Output structure', () => {
    it('should include all story sections', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'CZ',
        language: 'cs',
        contextualizationEnabled: true,
      });

      expect(result.title).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.title)).toBe(true);
      expect(Array.isArray(result.summary)).toBe(true);
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should preserve original metadata', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'CZ',
        language: 'cs',
        contextualizationEnabled: true,
      });

      expect(result.date).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it('should include tooltips when contextualization is enabled', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'CZ',
        language: 'cs',
        contextualizationEnabled: true,
      });

      const personSegment = result.title.find(s => s.type === 'person');
      expect(personSegment?.tooltip).toBeDefined();
    });

    it('should not include tooltips when contextualization is disabled', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'CZ',
        language: 'cs',
        contextualizationEnabled: false,
      });

      const personSegment = result.title.find(s => s.type === 'person');
      // Tooltip should be undefined when contextualization is off
      expect(personSegment?.tooltip).toBeUndefined();
    });
  });

  describe('Segment types', () => {
    it('should handle text segments', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      const textSegments = result.title.filter(s => s.type === 'text');
      expect(textSegments.length).toBeGreaterThan(0);
      expect(textSegments[0].text).toBeDefined();
    });

    it('should handle person markers', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      const personSegments = result.content.filter(s => s.type === 'person');
      expect(personSegments.length).toBeGreaterThan(0);
    });

    it('should handle place markers', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      const placeSegments = result.content.filter(s => s.type === 'place');
      expect(placeSegments.length).toBeGreaterThan(0);
    });

    it('should handle paragraph breaks', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      const paragraphBreaks = result.content.filter(s => s.type === 'paragraph-break');
      expect(paragraphBreaks.length).toBeGreaterThan(0);
      expect(paragraphBreaks[0].text).toBe('\n\n');
    });

    it('should handle source markers correctly', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      // Find source segments
      const sourceSegments = result.content.filter(s => s.type === 'source');
      expect(sourceSegments.length).toBeGreaterThan(0);

      // Check first source (death-toll)
      const deathTollSource = sourceSegments[0];
      expect(deathTollSource.text).toBe('[1]');
      expect(deathTollSource.tooltip).toBe("Iran International: Over 36,500 killed in Iran's deadliest massacre");
      expect(deathTollSource.style).toBe('bold-primary');
      expect(deathTollSource.metadata?.url).toBe('https://www.iranintl.com/en/202601255198');

      // Check second source (hospital-executions)
      const hospitalSource = sourceSegments[1];
      expect(hospitalSource.text).toBe('[2]');
      expect(hospitalSource.tooltip).toBe('Iran International: Horrifying details of extrajudicial executions in hospitals');
      expect(hospitalSource.style).toBe('bold-primary');
      expect(hospitalSource.metadata?.url).toBe('https://www.iranintl.com/en/202601255198');
    });

    it('should handle image markers correctly', async () => {
      const result = await translateStory({
        storySlug: 'raha-2026',
        country: 'US',
        language: 'en',
        contextualizationEnabled: true,
      });

      // Find image segments
      const imageSegments = result.content.filter(s => s.type === 'image');
      expect(imageSegments.length).toBeGreaterThan(0);

      // Check morgue-scene image
      const morgueImage = imageSegments[0];
      expect(morgueImage.text).toBe('');
      expect(morgueImage.type).toBe('image');
      expect(morgueImage.metadata?.src).toBe('/raha-protest-2026.jpg');
      expect(morgueImage.metadata?.alt).toContain('Morgue facilities');
      expect(morgueImage.metadata?.caption).toContain('Morgue facilities across Iran');
      expect(morgueImage.metadata?.contentWarning).toContain('graphic content');
      expect(morgueImage.metadata?.credit).toBe('Iran International');
      expect(morgueImage.metadata?.creditUrl).toBe('https://www.iranintl.com/en/202601255198');
    });
  });

  describe('Consistency between paths', () => {
    it('should produce similar structure for pre-translated and runtime', async () => {
      // Pre-translated (Czech)
      const preTranslated = await translateStory({
        storySlug: 'raha-2026',
        country: 'CZ',
        language: 'cs',
        contextualizationEnabled: true,
      });

      // Runtime (English to Greece - no pre-translation)
      const runtime = await translateStory({
        storySlug: 'raha-2026',
        country: 'GR',
        language: 'en',
        contextualizationEnabled: true,
      });

      // Both should have same sections
      expect(preTranslated.title.length).toBeGreaterThan(0);
      expect(runtime.title.length).toBeGreaterThan(0);
      expect(preTranslated.summary.length).toBeGreaterThan(0);
      expect(runtime.summary.length).toBeGreaterThan(0);
      expect(preTranslated.content.length).toBeGreaterThan(0);
      expect(runtime.content.length).toBeGreaterThan(0);

      // Both should have person segments with similar structure
      const preTransPerson = preTranslated.title.find(s => s.type === 'person');
      const runtimePerson = runtime.title.find(s => s.type === 'person');

      expect(preTransPerson).toBeDefined();
      expect(runtimePerson).toBeDefined();

      expect(preTransPerson?.original).toBeDefined();
      expect(runtimePerson?.original).toBeDefined();

      expect(preTransPerson?.style).toBe('strikethrough-muted');
      expect(runtimePerson?.style).toBe('strikethrough-muted');
    });
  });
});
