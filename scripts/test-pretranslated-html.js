/**
 * Test pre-translated file parsing and HTML rendering
 * Shows exactly how segments are rendered to understand spacing
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { translateMarker, getOriginalValue } from '../src/lib/translation/core.ts';
import { format } from 'date-fns';
import { cs, nl } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const localeMap = { cs, nl };

function formatDateLocalized(dateString, languageCode = 'en') {
  try {
    const date = new Date(dateString);
    const locale = localeMap[languageCode];
    return locale ? format(date, 'PPP', { locale }) : dateString;
  } catch (error) {
    return dateString;
  }
}

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
 * Current implementation of parsePreTranslated
 */
function parsePreTranslated(text, markers, storyId, languageCode = 'en') {
  const paragraphs = text.split(/\n+/).filter(p => p.trim());
  const allSegments = [];
  let sourceCounter = 1;

  paragraphs.forEach((paragraph, pIdx) => {
    const combinedRegex = /(\[\[MARKER:([^:]+):([^:]+):([^\|]+)\|([^\]]+)\]\])|(\{\{([^:}]+):([^}]+)\}\})/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(paragraph)) !== null) {
      if (match.index > lastIndex) {
        allSegments.push({
          type: 'text',
          text: paragraph.substring(lastIndex, match.index),
        });
      }

      if (match[1]) {
        const [, , type, key, original, translatedValue] = match;
        allSegments.push({
          type: 'translated',
          text: translatedValue,
          original: original,
        });
      } else if (match[6]) {
        const [, , , , , , fullMatch, type, key] = match;
        const marker = markers[key];

        if (type === 'source') {
          allSegments.push({
            type: 'source',
            text: `[${sourceCounter}]`,
          });
          sourceCounter++;
        } else if (type === 'date') {
          const dateValue = marker?.value || fullMatch;
          const formattedDate = formatDateLocalized(dateValue, languageCode);
          allSegments.push({
            type: 'text',
            text: formattedDate,
          });
        } else if (type === 'image') {
          // Skip
        } else if (marker) {
          const context = contextData;
          const countryCode = 'CZ';
          const countryNames = context.names[countryCode];
          const countryPlaces = context.places[countryCode];
          const targetCountry = context.countries.find(c => c.code === countryCode);

          const translationData = {
            country: countryCode,
            names: countryNames,
            places: countryPlaces,
            population: targetCountry?.population || 85000000,
            currencySymbol: targetCountry?.currencySymbol || '$',
            rialToLocal: targetCountry?.rialToLocal || 0.000024,
          };

          const result = translateMarker(key, marker, translationData, storyId);
          allSegments.push({
            type: result.original ? 'translated' : 'text',
            text: result.translated,
            original: result.original || null,
          });
        } else {
          allSegments.push({
            type: 'text',
            text: fullMatch,
          });
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < paragraph.length) {
      allSegments.push({
        type: 'text',
        text: paragraph.substring(lastIndex),
      });
    }

    if (pIdx < paragraphs.length - 1) {
      allSegments.push({
        type: 'paragraph-break',
        text: '\n\n',
      });
    }
  });

  return allSegments;
}

/**
 * Render segments as HTML like the website does
 */
function renderAsHTML(segments) {
  let html = '';
  for (const segment of segments) {
    switch (segment.type) {
      case 'paragraph-break':
        html += '<br><br>';
        break;
      case 'source':
        html += `<sup style="color: red">${segment.text}</sup>`;
        break;
      case 'translated':
        html += `<span class="strikethrough">${segment.original}</span> <span class="red">${segment.text}</span>`;
        break;
      case 'text':
        html += segment.text;
        break;
    }
  }
  return html;
}

/**
 * Render segments as plain text (how canvas would render without spacing logic)
 */
function renderAsPlainText(segments) {
  let text = '';
  for (const segment of segments) {
    if (segment.type === 'paragraph-break') {
      text += '\n\n';
    } else {
      text += segment.text;
    }
  }
  return text;
}

async function testPreTranslatedHTML() {
  console.log('🧪 Testing pre-translated file HTML rendering\n');

  await loadContextData();

  // Test Czech
  console.log('=== CZECH (cs-CZ) ===\n');
  const csPath = path.join(rootDir, 'src', 'lib', 'data', 'stories', 'raha-2026', 'story.cs-cz.yaml');
  const csContent = await fs.readFile(csPath, 'utf8');
  const csStory = yaml.load(csContent);

  // Load original markers
  const originalPath = path.join(rootDir, 'src', 'lib', 'data', 'stories', 'raha-2026', 'story.yaml');
  const originalContent = await fs.readFile(originalPath, 'utf8');
  const originalStory = yaml.load(originalContent);

  // Parse title
  const csTitleSegments = parsePreTranslated(csStory.title, originalStory.markers, originalStory.id, 'cs');
  console.log('Title segments:');
  csTitleSegments.forEach((seg, i) => {
    console.log(`  ${i}: [${seg.type}] "${seg.text}"${seg.original ? ` (orig: ${seg.original})` : ''}`);
  });

  console.log('\nTitle HTML:');
  console.log(renderAsHTML(csTitleSegments));

  console.log('\nTitle plain text (no spacing logic):');
  console.log(renderAsPlainText(csTitleSegments));

  // Parse first paragraph
  const firstPara = csStory.content.split('\n\n')[1]; // Skip disclaimer
  console.log('\n--- First Paragraph Raw Text ---');
  console.log(firstPara);

  const csContentSegments = parsePreTranslated(firstPara, originalStory.markers, originalStory.id, 'cs');
  console.log('\n--- First Paragraph Segments ---');
  csContentSegments.forEach((seg, i) => {
    const preview = seg.text.length > 30 ? seg.text.substring(0, 30) + '...' : seg.text;
    console.log(`  ${i}: [${seg.type}] "${preview}"${seg.original ? ` (orig: ${seg.original})` : ''}`);
  });

  console.log('\n--- First Paragraph HTML ---');
  console.log(renderAsHTML(csContentSegments));

  console.log('\n--- First Paragraph Plain Text (concatenated segments) ---');
  console.log(renderAsPlainText(csContentSegments));

  // Test Dutch
  console.log('\n\n=== DUTCH (nl-NL) ===\n');
  const nlPath = path.join(rootDir, 'src', 'lib', 'data', 'stories', 'raha-2026', 'story.nl-nl.yaml');
  try {
    const nlContent = await fs.readFile(nlPath, 'utf8');
    const nlStory = yaml.load(nlContent);

    const nlTitleSegments = parsePreTranslated(nlStory.title, originalStory.markers, originalStory.id, 'nl');
    console.log('Title segments:');
    nlTitleSegments.forEach((seg, i) => {
      console.log(`  ${i}: [${seg.type}] "${seg.text}"${seg.original ? ` (orig: ${seg.original})` : ''}`);
    });

    console.log('\nTitle HTML:');
    console.log(renderAsHTML(nlTitleSegments));

    console.log('\nTitle plain text:');
    console.log(renderAsPlainText(nlTitleSegments));

    // First paragraph
    const nlFirstPara = nlStory.content.split('\n\n')[1];
    console.log('\n--- First Paragraph Raw Text ---');
    console.log(nlFirstPara);

    const nlContentSegments = parsePreTranslated(nlFirstPara, originalStory.markers, originalStory.id, 'nl');
    console.log('\n--- First Paragraph Segments ---');
    nlContentSegments.forEach((seg, i) => {
      const preview = seg.text.length > 30 ? seg.text.substring(0, 30) + '...' : seg.text;
      console.log(`  ${i}: [${seg.type}] "${preview}"${seg.original ? ` (orig: ${seg.original})` : ''}`);
    });

    console.log('\n--- First Paragraph Plain Text ---');
    console.log(renderAsPlainText(nlContentSegments));
  } catch (error) {
    console.log('Dutch translation not found:', error.message);
  }

  console.log('\n✅ Test complete');
}

testPreTranslatedHTML().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
