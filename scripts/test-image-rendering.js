/**
 * Test script to debug image rendering - prints text segments
 * so we can see the structure without rendering actual images
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Parse pre-translated text with [[MARKER:...]] format
 */
function parsePreTranslated(text) {
  const paragraphs = text.split(/\n+/).filter(p => p.trim());
  const allSegments = [];

  paragraphs.forEach((paragraph, pIdx) => {
    // Match both [[MARKER:...]] and [[COMPARISON:...]] formats
    const combinedRegex = /(\[\[MARKER:([^:]+):([^:]+):([^|]+)\|([^|\]]+)(?:\|([^\]]+))?\]\])|(\[\[COMPARISON:([^|]+)\|([^|]+)\|([^\]]+)\]\])|(\{\{([^:}]+):([^}]+)\}\})/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(paragraph)) !== null) {
      // Add text before marker
      if (match.index > lastIndex) {
        const text = paragraph.substring(lastIndex, match.index);
        allSegments.push({
          type: 'text',
          text: text,
        });
      }

      if (match[1]) {
        // [[MARKER:type:key:original|value|explanation]] format
        const [, , type, key, original, translatedValue, explanation] = match;
        allSegments.push({
          type: 'translated',
          markerType: type,
          key: key,
          text: translatedValue,
          original: original,
          explanation: explanation || null,
        });
      } else if (match[7]) {
        // [[COMPARISON:original|translated|explanation]] format
        const [, , , , , , , , original, translated, explanation] = match;
        allSegments.push({
          type: 'comparison',
          text: translated,
          original: original,
          explanation: explanation,
        });
      } else if (match[11]) {
        // {{type:key}} format - placeholder that needs to be filled
        const [, , , , , , , , , , , markerType, markerKey] = match;
        allSegments.push({
          type: 'placeholder',
          markerType: markerType,
          key: markerKey,
          text: `{{${markerType}:${markerKey}}}`,
        });
      }

      lastIndex = match.index + match[0].length;
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

    // Add paragraph break (except after last paragraph)
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
 * Print segments in a readable format
 */
function printSegments(segments, label) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${label}`);
  console.log('='.repeat(80));

  segments.forEach((seg, i) => {
    const prefix = `[${i.toString().padStart(3, '0')}]`;

    if (seg.type === 'text') {
      console.log(`${prefix} TEXT: "${seg.text}"`);
    } else if (seg.type === 'translated') {
      console.log(`${prefix} TRANSLATED (${seg.markerType}:${seg.key}):`);
      console.log(`      Original: "${seg.original}"`);
      console.log(`      Translated: "${seg.text}"`);
      if (seg.explanation) {
        console.log(`      Explanation: "${seg.explanation}"`);
      }
    } else if (seg.type === 'comparison') {
      console.log(`${prefix} COMPARISON:`);
      console.log(`      Text: "${seg.text}"`);
      console.log(`      Explanation: "${seg.explanation}"`);
    } else if (seg.type === 'placeholder') {
      console.log(`${prefix} PLACEHOLDER: ${seg.text} (needs filling)`);
    } else if (seg.type === 'paragraph-break') {
      console.log(`${prefix} PARAGRAPH BREAK`);
    } else {
      console.log(`${prefix} UNKNOWN: ${JSON.stringify(seg)}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('RENDERED TEXT:');
  console.log('='.repeat(80));
  const renderedText = segments
    .filter(s => s.type !== 'paragraph-break')
    .map(s => s.text)
    .join('');
  console.log(renderedText);
  console.log('='.repeat(80) + '\n');
}

/**
 * Main test function
 */
async function main() {
  const storySlug = process.argv[2] || 'raha-2026';
  const country = process.argv[3] || 'US';
  const lang = process.argv[4] || 'en';

  console.log(`\n🔍 Testing image rendering for: ${storySlug} / ${country} / ${lang}\n`);

  try {
    // First try to load translated version
    let story = null;
    let isTranslated = false;

    if (lang !== 'en') {
      const translatedPath = path.join(
        rootDir,
        'src/lib/data/stories',
        storySlug,
        `story.${lang}-${country.toLowerCase()}.yaml`
      );

      try {
        const translatedContent = await fs.readFile(translatedPath, 'utf8');
        story = yaml.load(translatedContent);
        isTranslated = true;
        console.log(`📖 Story loaded from translation: ${story.title || 'Untitled'}`);
      } catch (_e) {
        console.log(`⚠️  No translation found, using original with runtime translation`);
      }
    }

    // Fall back to original story.yaml
    if (!story) {
      const originalPath = path.join(
        rootDir,
        'src/lib/data/stories',
        storySlug,
        'story.yaml'
      );
      const originalContent = await fs.readFile(originalPath, 'utf8');
      story = yaml.load(originalContent);
      console.log(`📖 Story loaded from original: ${story.title || 'Untitled'}`);
      console.log(`🔄 Will use runtime translation to ${country} context\n`);
    }

    // Parse based on whether it's translated or needs runtime translation
    if (isTranslated) {
      // Parse pre-translated markers
      if (story.title) {
        const titleSegments = parsePreTranslated(story.title);
        printSegments(titleSegments, 'TITLE (Pre-translated)');
      }

      if (story.summary) {
        const summarySegments = parsePreTranslated(story.summary);
        printSegments(summarySegments, 'SUMMARY (Pre-translated)');
      }

      if (story.content) {
        const contentPreview = story.content.substring(0, 500);
        const contentSegments = parsePreTranslated(contentPreview);
        printSegments(contentSegments, 'CONTENT (Pre-translated, first 500 chars)');
      }
    } else {
      // Show that runtime translation would be used
      console.log(`⚙️  Runtime translation would use:`);
      console.log(`   Country: ${country}`);
      console.log(`   Language: ${lang}`);
      console.log(`\n   This simulates what generateTwitterImage() does with isTranslated=false\n`);

      if (story.title) {
        const titleSegments = parsePreTranslated(story.title);
        printSegments(titleSegments, 'TITLE (Original - shows {{markers}})');
      }
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
