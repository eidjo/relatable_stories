/**
 * Verify exactly what text will appear in generated images
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

import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const localeMap = { en: enUS };

function formatDateLocalized(dateString, languageCode = 'en') {
  try {
    const date = new Date(dateString);
    const locale = localeMap[languageCode] || localeMap['en'];
    return format(date, 'PPP', { locale });
  } catch (_error) {
    return dateString;
  }
}

// Exact copy of translateWithOriginals from generate-share-images-improved.js
function translateWithOriginals(text, markers, countryCode, storyId, languageCode = 'en') {
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
    languageCode: languageCode,
  };

  const translationContext = {
    markers: markers,
    resolved: new Map(),
    storyId: storyId,
  };

  const paragraphs = text.split(/\n+/).filter(p => p.trim());
  const allSegments = [];
  let sourceCounter = 1;

  paragraphs.forEach((paragraph) => {
    let lastIndex = 0;
    const markerRegex = /\{\{([^:}]+)(?::([^}]+))?\}\}/g;
    let match;

    while ((match = markerRegex.exec(paragraph)) !== null) {
      if (match.index > lastIndex) {
        allSegments.push({
          type: 'text',
          text: paragraph.substring(lastIndex, match.index),
        });
      }

      const [fullMatch, key, suffix] = match;

      if (key === 'source') {
        allSegments.push({ type: 'source', text: `[${sourceCounter}]` });
        sourceCounter++;
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      if (key === 'image') {
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      const marker = markers[key];

      if (!marker) {
        allSegments.push({ type: 'text', text: fullMatch });
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      // Handle date markers - format with locale
      if ('date' in marker) {
        const formattedDate = formatDateLocalized(marker.date, languageCode);
        allSegments.push({
          type: 'text',
          text: formattedDate,
        });
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      if (suffix) {
        if (suffix === 'age' && marker.age) {
          allSegments.push({ type: 'text', text: marker.age.toString() });
          lastIndex = match.index + fullMatch.length;
          continue;
        }
      }

      const result = translateMarkerV2(key, marker, translationData, translationContext);

      if (result.original && result.value !== result.original) {
        allSegments.push({
          type: 'translated',
          text: result.value,
          original: result.original,
        });
      } else {
        allSegments.push({
          type: 'text',
          text: result.value,
        });
      }

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < paragraph.length) {
      const remaining = paragraph.substring(lastIndex);
      if (remaining) {
        allSegments.push({ type: 'text', text: remaining });
      }
    }
  });

  return allSegments;
}

async function main() {
  await loadContextData();

  const storyPath = path.join(rootDir, 'src/lib/data/stories/raha-2026/story.yaml');
  const storyContent = await fs.readFile(storyPath, 'utf8');
  const story = yaml.load(storyContent);

  console.log('\n' + '='.repeat(80));
  console.log('VERIFYING: raha-2026-en-gr-light.png');
  console.log('='.repeat(80));

  const titleSegments = translateWithOriginals(story.title, story.markers, 'GR', story.id);
  const titleText = titleSegments.map(s => s.text).join('');

  console.log(`\nTitle that will appear in image:`);
  console.log(`  "${titleText}"\n`);

  const summarySegments = translateWithOriginals(story.summary, story.markers, 'GR', story.id);
  const summaryText = summarySegments.map(s => s.text).join('');

  console.log(`Summary that will appear in image:`);
  console.log(`  "${summaryText}"\n`);

  const contentLines = story.content.split('\n').slice(2, 4); // Skip disclaimer, get first 2 lines
  const contentPreview = contentLines.join('\n');
  const contentSegments = translateWithOriginals(contentPreview, story.markers, 'GR', story.id);
  const contentText = contentSegments.map(s => s.text).join('');

  console.log(`First lines of content:`);
  console.log(`  ${contentText.substring(0, 200)}...\n`);

  console.log('='.repeat(80));
  console.log('✅ This is the exact text rendered in the image');
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);
