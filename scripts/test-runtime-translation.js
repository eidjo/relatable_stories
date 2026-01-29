/**
 * Test runtime translation for English versions
 * Simulates what generate-share-images does for en-GR, en-US, etc.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { translateMarkerV2 } from '../src/lib/translation/core.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let contextData = null;

async function loadContextData() {
  if (contextData) return contextData;

  const contextsDir = path.join(rootDir, 'src', 'lib', 'data', 'contexts');

  const countriesYaml = await fs.readFile(path.join(contextsDir, 'countries.yaml'), 'utf8');
  const namesYaml = await fs.readFile(path.join(contextsDir, 'names.yaml'), 'utf8');
  const placesYaml = await fs.readFile(path.join(contextsDir, 'places.yaml'), 'utf8');

  contextData = {
    countries: yaml.load(countriesYaml).countries,
    names: yaml.load(namesYaml),
    places: yaml.load(placesYaml),
  };

  return contextData;
}

/**
 * Simulate translateWithOriginals from generate-share-images
 */
function translateWithOriginals(text, markers, countryCode, storyId) {
  const context = contextData;
  const countryNames = context.names[countryCode] || context.names['US'];
  const countryPlaces = context.places[countryCode] || context.places['US'];
  const targetCountry = context.countries.find(c => c.code === countryCode);

  const translationData = {
    country: countryCode,
    names: countryNames,
    places: countryPlaces,
    population: targetCountry?.population || 85000000,
    currencySymbol: targetCountry?.['currency-symbol'] || '$',
    rialToLocal: targetCountry?.['rial-to-local'] || 0.000024,
    comparableEvents: [],
    languageCode: 'en',
  };

  const translationContext = {
    markers: markers,
    resolved: new Map(),
    storyId: storyId,
  };

  // Split by newlines
  const paragraphs = text.split(/\n+/).filter(p => p.trim());
  const allSegments = [];

  paragraphs.forEach((paragraph) => {
    let lastIndex = 0;
    const markerRegex = /\{\{([^:}]+)(?::([^}]+))?\}\}/g;
    let match;

    while ((match = markerRegex.exec(paragraph)) !== null) {
      // Add text before marker
      if (match.index > lastIndex) {
        allSegments.push({
          type: 'text',
          text: paragraph.substring(lastIndex, match.index),
        });
      }

      const [fullMatch, key, suffix] = match;
      const marker = markers[key];

      if (!marker) {
        allSegments.push({ type: 'text', text: fullMatch });
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      // Handle suffixes
      if (suffix) {
        if (suffix === 'age' && marker.age) {
          allSegments.push({
            type: 'text',
            text: marker.age.toString(),
          });
          lastIndex = match.index + fullMatch.length;
          continue;
        }
      }

      // Translate marker
      const result = translateMarkerV2(key, marker, translationData, translationContext);

      allSegments.push({
        type: result.original ? 'translated' : 'text',
        text: result.value,
        original: result.original || null,
      });

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < paragraph.length) {
      const remaining = paragraph.substring(lastIndex);
      if (remaining) {
        allSegments.push({
          type: 'text',
          text: remaining,
        });
      }
    }
  });

  return allSegments;
}

async function main() {
  const storySlug = process.argv[2] || 'raha-2026';
  const country = process.argv[3] || 'GR';  // Greece
  const lang = process.argv[4] || 'en';     // English

  console.log(`\n🔍 Testing runtime translation for: ${storySlug} / ${lang}-${country}\n`);

  await loadContextData();

  // Load original story
  const originalPath = path.join(
    rootDir,
    'src/lib/data/stories',
    storySlug,
    'story.yaml'
  );

  const originalContent = await fs.readFile(originalPath, 'utf8');
  const story = yaml.load(originalContent);

  console.log(`📖 Original title: ${story.title}`);

  // Translate title to target country
  const titleSegments = translateWithOriginals(story.title, story.markers, country, story.id);

  console.log(`\n✨ Translated segments:`);
  titleSegments.forEach((seg, i) => {
    if (seg.type === 'translated') {
      console.log(`   [${i}] "${seg.original}" → "${seg.text}"`);
    } else {
      console.log(`   [${i}] "${seg.text}"`);
    }
  });

  const renderedTitle = titleSegments.map(s => s.text).join('');
  console.log(`\n📝 Final rendered title: ${renderedTitle}\n`);

  // Test first line of content too
  const contentFirstLine = story.content.split('\n')[2]; // Skip disclaimer
  console.log(`📖 Original content (line 1): ${contentFirstLine.substring(0, 100)}...`);

  const contentSegments = translateWithOriginals(contentFirstLine, story.markers, country, story.id);
  const renderedContent = contentSegments.map(s => s.text).join('');
  console.log(`📝 Translated content: ${renderedContent.substring(0, 150)}...\n`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
