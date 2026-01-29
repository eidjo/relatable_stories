/**
 * Test script to verify segment generation for share images
 * Shows the "hydrated HTML" structure before rendering to canvas
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { translateMarker, getOriginalValue } from '../src/lib/translation/core.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load context data
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
 * Translate text and track original values for strikethrough
 * Matches website's approach: split by paragraphs first, then process markers
 */
function translateWithOriginals(text, markers, countryCode, storyId) {
  const context = contextData;
  const countryNames = context.names[countryCode] || context.names['US'];
  const countryPlaces = context.places[countryCode] || context.places['US'];
  const targetCountry = context.countries.find(c => c.code === countryCode);

  // Build TranslationData for core functions
  const translationData = {
    country: countryCode,
    names: countryNames,
    places: countryPlaces,
    population: targetCountry?.population || 85000000,
    currencySymbol: targetCountry?.currencySymbol || '$',
    rialToLocal: targetCountry?.rialToLocal || 0.000024,
  };

  // Split by newlines first to preserve paragraph structure (like website does)
  const paragraphs = text.split(/\n+/).filter(p => p.trim());
  const allSegments = [];
  let sourceCounter = 1;

  paragraphs.forEach((paragraph, pIdx) => {
    let lastIndex = 0;
    const markerRegex = /\{\{([^:}]+):([^}]+)\}\}/g;
    let match;

    while ((match = markerRegex.exec(paragraph)) !== null) {
      // Add text before marker
      if (match.index > lastIndex) {
        allSegments.push({
          type: 'text',
          text: paragraph.substring(lastIndex, match.index),
        });
      }

      const [fullMatch, type, key] = match;
      const marker = markers[key];

      // Handle sources specially
      if (type === 'source') {
        allSegments.push({
          type: 'source',
          text: `[${sourceCounter}]`,
        });
        sourceCounter++;
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      if (!marker) {
        allSegments.push({ type: 'text', text: fullMatch });
        lastIndex = match.index + fullMatch.length;
        continue;
      }

      // Use core translation function
      const result = translateMarker(key, marker, translationData, storyId);

      if (result.original && result.translated !== result.original) {
        allSegments.push({
          type: 'translated',
          text: result.translated,
          original: result.original,
        });
      } else {
        allSegments.push({
          type: 'text',
          text: result.translated,
        });
      }

      lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text from paragraph
    if (lastIndex < paragraph.length) {
      allSegments.push({
        type: 'text',
        text: paragraph.substring(lastIndex),
      });
    }

    // Add paragraph break after each paragraph (except the last one)
    if (pIdx < paragraphs.length - 1) {
      allSegments.push({
        type: 'paragraph-break',
        text: '\\n\\n',
      });
    }
  });

  return allSegments;
}

/**
 * Render segments as pseudo-HTML for visualization
 */
function renderSegmentsAsHTML(segments) {
  let html = '';
  for (const segment of segments) {
    switch (segment.type) {
      case 'paragraph-break':
        html += '<br><br>\n';
        break;
      case 'source':
        html += `<sup style="color: red">${segment.text}</sup>`;
        break;
      case 'translated':
        html += `<span style="text-decoration: line-through; opacity: 0.5">${segment.original}</span> <span style="color: red">${segment.text}</span>`;
        break;
      case 'text':
        html += segment.text;
        break;
    }
  }
  return html;
}

/**
 * Main test function
 */
async function testSegmentGeneration() {
  console.log('🧪 Testing segment generation for share images\n');

  await loadContextData();

  const storiesDir = path.join(rootDir, 'src', 'lib', 'data', 'stories');
  const storyYamlPath = path.join(storiesDir, 'raha-2026', 'story.yaml');

  const yamlContent = await fs.readFile(storyYamlPath, 'utf8');
  const story = yaml.load(yamlContent);

  console.log('Story:', story.title);
  console.log('Content length:', story.content.length);
  console.log('Newline count:', (story.content.match(/\n/g) || []).length);
  console.log('Paragraph breaks (\\n\\n):', (story.content.match(/\n\n/g) || []).length);
  console.log('\n--- Content Preview (first 200 chars) ---');
  console.log(story.content.substring(0, 200).replace(/\n/g, '\\n'));
  console.log('\n');

  // Translate title
  const titleSegments = translateWithOriginals(story.title, story.markers, 'US', story.id);
  console.log('=== TITLE SEGMENTS ===');
  titleSegments.forEach((seg, i) => {
    console.log(`${i}: [${seg.type}] "${seg.text}"${seg.original ? ` (orig: "${seg.original}")` : ''}`);
  });
  console.log('\nTitle as HTML:');
  console.log(renderSegmentsAsHTML(titleSegments));

  // Translate content (first 500 chars for testing)
  const contentPreview = story.content.substring(0, 500);
  const contentSegments = translateWithOriginals(contentPreview, story.markers, 'US', story.id);

  console.log('\n=== CONTENT SEGMENTS (first 500 chars) ===');
  contentSegments.forEach((seg, i) => {
    const preview = seg.text.length > 50 ? seg.text.substring(0, 50) + '...' : seg.text;
    console.log(`${i}: [${seg.type}] "${preview}"${seg.original ? ` (orig: "${seg.original}")` : ''}`);
  });

  console.log('\n=== Content as HTML ===');
  console.log(renderSegmentsAsHTML(contentSegments));

  console.log('\n✅ Test complete');
}

testSegmentGeneration().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
