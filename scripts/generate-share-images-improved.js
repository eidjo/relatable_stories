/**
 * Generate social media share images with perfect website styling
 * Uses @napi-rs/canvas with JetBrains Mono font
 */

import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { translateMarker, getOriginalValue } from '../src/lib/translation/core.ts';
import { format } from 'date-fns';
import { enUS, cs, fr, de, es, it, nl, sv, nb, da, fi, pl, pt } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Image dimensions
const TWITTER_WIDTH = 1200;
const TWITTER_HEIGHT = 630;
const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1920;

// Date-fns locale map
const localeMap = {
  en: enUS,
  cs: cs,
  fr: fr,
  de: de,
  es: es,
  it: it,
  nl: nl,
  sv: sv,
  no: nb,
  da: da,
  fi: fi,
  pl: pl,
  pt: pt,
};

/**
 * Format a date string for a specific language
 */
function formatDateLocalized(dateString, languageCode = 'en') {
  try {
    const date = new Date(dateString);
    const locale = localeMap[languageCode] || localeMap['en'];
    return format(date, 'PPP', { locale });
  } catch (error) {
    return dateString;
  }
}

// Website colors (exact match)
const THEMES = {
  dark: {
    background: '#0a0a0a',
    primary: '#ef4444',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.7)',
    strikethrough: 'rgba(255, 255, 255, 0.3)',
  },
  light: {
    background: '#ffffff',
    primary: '#dc2626',
    text: '#0a0a0a',
    textMuted: 'rgba(10, 10, 10, 0.7)',
    strikethrough: 'rgba(10, 10, 10, 0.3)',
  },
};

// Load context data
let contextData = null;
let countryLanguagesData = null;

async function loadContextData() {
  if (contextData) return contextData;

  const contextsDir = path.join(rootDir, 'src', 'lib', 'data', 'contexts');

  const countriesYaml = await fs.readFile(path.join(contextsDir, 'countries.yaml'), 'utf8');
  const namesYaml = await fs.readFile(path.join(contextsDir, 'names.yaml'), 'utf8');
  const placesYaml = await fs.readFile(path.join(contextsDir, 'places.yaml'), 'utf8');
  const countryLanguagesYaml = await fs.readFile(path.join(contextsDir, 'country-languages.yaml'), 'utf8');

  contextData = {
    countries: yaml.load(countriesYaml).countries,
    names: yaml.load(namesYaml),
    places: yaml.load(placesYaml),
  };

  countryLanguagesData = yaml.load(countryLanguagesYaml);

  return contextData;
}

// Load JetBrains Mono font
const fontPath = path.join(rootDir, 'static', 'fonts', 'JetBrainsMono-Regular.ttf');
try {
  GlobalFonts.registerFromPath(fontPath, 'JetBrains Mono');
  console.log('✓ Loaded JetBrains Mono font');
} catch (error) {
  console.warn('⚠ Could not load JetBrains Mono font, using default');
}

/**
 * Parse pre-translated text with [[MARKER:...]] format
 * Also handles {{date:...}} and {{source:...}} markers that weren't translated
 */
function parsePreTranslated(text, markers, storyId, languageCode = 'en') {
  // Split by newlines first to preserve paragraph structure
  const paragraphs = text.split(/\n+/).filter(p => p.trim());
  const allSegments = [];
  let sourceCounter = 1;

  paragraphs.forEach((paragraph, pIdx) => {
    // Combined regex for both [[MARKER:...]] and {{...}} formats
    const combinedRegex = /(\[\[MARKER:([^:]+):([^:]+):([^\|]+)\|([^\]]+)\]\])|(\{\{([^:}]+):([^}]+)\}\})/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(paragraph)) !== null) {
      // Add text before marker
      if (match.index > lastIndex) {
        allSegments.push({
          type: 'text',
          text: paragraph.substring(lastIndex, match.index),
        });
      }

      // Check which format matched
      if (match[1]) {
        // [[MARKER:...]] format
        const [, , type, key, original, translatedValue] = match;
        allSegments.push({
          type: 'translated',
          text: translatedValue,
          original: original,
        });
      } else if (match[6]) {
        // {{...}} format - needs to be translated
        const [, , , , , , fullMatch, type, key] = match;
        const marker = markers[key];

        // Handle sources specially
        if (type === 'source') {
          allSegments.push({
            type: 'source',
            text: `[${sourceCounter}]`,
          });
          sourceCounter++;
        } else if (type === 'date') {
          // Format date using date-locale
          const dateValue = marker?.value || fullMatch;
          const formattedDate = formatDateLocalized(dateValue, languageCode);
          allSegments.push({
            type: 'text',
            text: formattedDate,
          });
        } else if (type === 'image') {
          // Skip images in share images
        } else if (marker) {
          // Translate other marker types that weren't pre-translated
          const context = contextData;
          const countryCode = 'US'; // Fallback for untranslated markers
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
          // Marker not found, keep original
          allSegments.push({
            type: 'text',
            text: fullMatch,
          });
        }
      }

      lastIndex = match.index + match[0].length;
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
        text: '\n\n',
      });
    }
  });

  return allSegments;
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
        text: '\n\n',
      });
    }
  });

  return allSegments;
}

/**
 * Draw text with segments (handling strikethrough originals and sources)
 * Returns final Y position reached
 *
 * IMPORTANT: This matches the website rendering - segments are concatenated directly
 * with NO automatic spacing. All spacing is already in the segment text.
 */
function drawSegmentedText(ctx, segments, x, y, maxWidth, maxHeight, colors, fontSize) {
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

  let currentX = x;
  let currentY = y;
  const lineHeight = fontSize * 1.4;
  const spaceWidth = ctx.measureText(' ').width;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Stop if we've reached max height
    if (currentY > maxHeight) {
      break;
    }

    if (segment.type === 'source') {
      // Draw source citation in primary color
      ctx.fillStyle = colors.primary;
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      const width = ctx.measureText(segment.text).width;

      if (currentX + width > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(segment.text, currentX, currentY);
      }
      currentX += width;
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

    } else if (segment.type === 'translated' && segment.original) {
      // Draw strikethrough original
      ctx.fillStyle = colors.strikethrough;
      const originalWidth = ctx.measureText(segment.original).width;

      if (currentX + originalWidth > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(segment.original, currentX, currentY);
        // Draw strikethrough line
        const lineY = currentY - fontSize * 0.3;
        ctx.strokeStyle = colors.strikethrough;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(currentX, lineY);
        ctx.lineTo(currentX + originalWidth, lineY);
        ctx.stroke();
      }

      currentX += originalWidth + spaceWidth;

      // Draw translation in primary color
      ctx.fillStyle = colors.primary;
      const translatedWidth = ctx.measureText(segment.text).width;

      if (currentX + translatedWidth > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(segment.text, currentX, currentY);
      }
      currentX += translatedWidth;
      // NO automatic space after - next segment will start directly

      ctx.fillStyle = colors.textMuted;

    } else if (segment.type === 'paragraph-break') {
      // Handle paragraph breaks
      currentX = x;
      currentY += lineHeight * 1.5; // Paragraph spacing
    } else {
      // Regular text segment - render exactly as-is with word wrapping
      // Split by spaces for wrapping, but preserve leading/trailing spaces
      const text = segment.text;
      ctx.fillStyle = colors.textMuted;

      // Handle leading spaces
      const leadingSpaces = text.match(/^\s+/)?.[0] || '';
      for (let i = 0; i < leadingSpaces.length; i++) {
        currentX += spaceWidth;
      }

      // Split by spaces and process words
      const trimmedText = text.trim();
      if (trimmedText) {
        const words = trimmedText.split(/\s+/);

        for (let wIdx = 0; wIdx < words.length; wIdx++) {
          const word = words[wIdx];
          if (!word) continue;

          const wordWidth = ctx.measureText(word).width;

          // Wrap if needed (but not if we're at line start)
          if (currentX + wordWidth > x + maxWidth && currentX > x) {
            currentX = x;
            currentY += lineHeight;
          }

          if (currentY <= maxHeight) {
            ctx.fillText(word, currentX, currentY);
          }
          currentX += wordWidth;

          // Add space after word (except for last word in segment)
          if (wIdx < words.length - 1) {
            currentX += spaceWidth;
          }
        }
      }

      // Handle trailing spaces
      const trailingSpaces = text.match(/\s+$/)?.[0] || '';
      for (let i = 0; i < trailingSpaces.length; i++) {
        currentX += spaceWidth;
      }
    }
  }

  return currentY;
}

/**
 * Generate Twitter share image
 */
async function generateTwitterImage(story, outputPath, theme, countryCode, countryName, languageCode = 'en', isTranslated = false) {
  const canvas = createCanvas(TWITTER_WIDTH, TWITTER_HEIGHT);
  const ctx = canvas.getContext('2d');
  const colors = THEMES[theme];

  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, TWITTER_WIDTH, TWITTER_HEIGHT);

  // Red accent bar
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, 8, TWITTER_HEIGHT);

  // Footer positioning - fixed at bottom
  const footerHeight = 100;
  const footerY = TWITTER_HEIGHT - footerHeight + 20;
  const contentMaxY = footerY - 80; // Leave space for gradient

  // Translate title - use parsePreTranslated if story is pre-translated
  const titleSegments = isTranslated
    ? parsePreTranslated(story.title, story.markers, story.id, languageCode)
    : translateWithOriginals(story.title, story.markers, countryCode, story.id);

  // Draw title with translation (increased from 48px to 56px)
  ctx.font = 'bold 56px "JetBrains Mono", monospace';
  let yPos = 80;
  const titleEndY = drawSegmentedText(ctx, titleSegments, 60, yPos, TWITTER_WIDTH - 120, yPos + 150, colors, 56);
  yPos = titleEndY + 60; // Increased gap between title and content

  // Translate and draw content (preserve paragraphs)
  const contentSegments = isTranslated
    ? parsePreTranslated(story.content, story.markers, story.id, languageCode)
    : translateWithOriginals(
        story.content,
    story.markers,
    countryCode,
    story.id
  );

  drawSegmentedText(ctx, contentSegments, 60, yPos, TWITTER_WIDTH - 120, contentMaxY, colors, 28); // Increased from 24px to 28px

  // Gradient blur overlay
  const gradient = ctx.createLinearGradient(0, contentMaxY - 60, 0, contentMaxY + 20);
  gradient.addColorStop(0, colors.background + '00'); // Transparent
  gradient.addColorStop(1, colors.background); // Solid
  ctx.fillStyle = gradient;
  ctx.fillRect(0, contentMaxY - 60, TWITTER_WIDTH, 80);

  // Footer
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText(`Translated for ${countryName}`, 60, footerY);

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText('Relatable Stories from Iran', 60, footerY + 30);

  ctx.fillStyle = colors.textMuted;
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText('Experience stories in your local context', 60, footerY + 55);

  // Save
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
}

/**
 * Generate Instagram share image
 */
async function generateInstagramImage(story, outputPath, theme, countryCode, countryName, languageCode = 'en', isTranslated = false) {
  const canvas = createCanvas(INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
  const ctx = canvas.getContext('2d');
  const colors = THEMES[theme];

  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  // Red accent bar
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, 12);

  // Footer positioning - fixed at bottom (increased for larger text)
  const footerHeight = 380;
  const footerY = INSTAGRAM_HEIGHT - footerHeight + 20;
  const contentMaxY = footerY - 120; // Leave space for gradient

  // Translate title - use parsePreTranslated if story is pre-translated
  const titleSegments = isTranslated
    ? parsePreTranslated(story.title, story.markers, story.id, languageCode)
    : translateWithOriginals(story.title, story.markers, countryCode, story.id);

  // Draw title with translation (96px = 64px * 1.5, extra space at top for Instagram UI)
  ctx.font = 'bold 96px "JetBrains Mono", monospace';
  let yPos = 200; // Increased from 120 to leave space for Instagram story overlay
  const titleEndY = drawSegmentedText(ctx, titleSegments, 60, yPos, INSTAGRAM_WIDTH - 120, yPos + 300, colors, 96);
  yPos = titleEndY + 80; // Gap between title and content

  // Translate and draw content (preserve paragraphs)
  const contentSegments = isTranslated
    ? parsePreTranslated(story.content, story.markers, story.id, languageCode)
    : translateWithOriginals(
        story.content,
        story.markers,
        countryCode,
        story.id
      );

  drawSegmentedText(ctx, contentSegments, 60, yPos, INSTAGRAM_WIDTH - 120, contentMaxY, colors, 48); // Increased from 34px to 48px (34 * 1.5)

  // Gradient blur overlay
  const gradient = ctx.createLinearGradient(0, contentMaxY - 120, 0, contentMaxY + 20);
  gradient.addColorStop(0, colors.background + '00'); // Transparent
  gradient.addColorStop(1, colors.background); // Solid
  ctx.fillStyle = gradient;
  ctx.fillRect(0, contentMaxY - 120, INSTAGRAM_WIDTH, 140);

  // Footer (all sizes increased by 1.5x)
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 33px "JetBrains Mono", monospace';
  ctx.fillText(`Translated for ${countryName}`, 60, footerY);

  ctx.fillStyle = colors.textMuted;
  ctx.font = '27px "JetBrains Mono", monospace';
  ctx.fillText(`${story.date} • ${story.severity}`, 60, footerY + 45);

  // Hashtags
  if (story.hashtags) {
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.fillText(story.hashtags, 60, footerY + 90);
  }

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 39px "JetBrains Mono", monospace';
  ctx.fillText('Read the full story →', 60, footerY + 140);

  ctx.fillStyle = colors.textMuted;
  ctx.font = '30px "JetBrains Mono", monospace';
  ctx.fillText('Link in Story', 60, footerY + 185);

  // Save
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
}

/**
 * Wrap text helper
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Main generation function
 */
async function generateAllImages() {
  console.log('🎨 Generating share images with website styling...\n');

  await loadContextData();

  const twitterDir = path.join(rootDir, 'static', 'share', 'twitter');
  const instagramDir = path.join(rootDir, 'static', 'share', 'instagram');
  await fs.mkdir(twitterDir, { recursive: true });
  await fs.mkdir(instagramDir, { recursive: true});

  const storiesDir = path.join(rootDir, 'src', 'lib', 'data', 'stories');
  const entries = await fs.readdir(storiesDir, { withFileTypes: true });
  const storyFolders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  let totalGenerated = 0;

  for (const folder of storyFolders) {
    const storyYamlPath = path.join(storiesDir, folder, 'story.yaml');

    try {
      const yamlContent = await fs.readFile(storyYamlPath, 'utf8');
      const originalStory = yaml.load(yamlContent);

      // Get a preview title
      const previewSegments = translateWithOriginals(originalStory.title, originalStory.markers, 'US', originalStory.id);
      const previewTitle = previewSegments.map(s => s.text || '').join('');
      console.log(`📸 Generating: ${previewTitle}`);

      for (const country of contextData.countries) {
        // Get available languages for this country
        const availableLanguages = countryLanguagesData?.countries[country.code]?.languages || [];

        // Always generate English version (original)
        const languages = ['en', ...availableLanguages.filter(lang => lang !== 'en')];

        for (const lang of languages) {
          let story = originalStory;
          let isTranslated = false;

          // Try to load translated version if not English
          if (lang !== 'en') {
            const translatedPath = path.join(storiesDir, folder, `story.${lang}-${country.code.toLowerCase()}.yaml`);
            try {
              const translatedContent = await fs.readFile(translatedPath, 'utf8');
              const translatedStory = yaml.load(translatedContent);
              // Merge translated content with original markers
              story = {
                ...translatedStory,
                markers: originalStory.markers, // Use original markers for parsing
              };
              isTranslated = true;
            } catch (error) {
              // Translation doesn't exist, use original with runtime translation
              console.log(`  ⏭️  No translation for ${lang}-${country.code}, using runtime translation`);
            }
          }

          for (const theme of ['dark', 'light']) {
            const twitterPath = path.join(
              twitterDir,
              `${story.slug}-${lang}-${country.code.toLowerCase()}-${theme}.png`
            );
            await generateTwitterImage(story, twitterPath, theme, country.code, country.name, lang, isTranslated);

            const instagramPath = path.join(
              instagramDir,
              `${story.slug}-${lang}-${country.code.toLowerCase()}-${theme}.png`
            );
            await generateInstagramImage(story, instagramPath, theme, country.code, country.name, lang, isTranslated);

            totalGenerated += 2;
          }
        }
      }

      console.log(`  ✓ Images generated`);
    } catch (error) {
      console.error(`  ✗ Error for ${folder}:`, error.message);
    }
  }

  console.log(`\n✅ Generated ${totalGenerated} images total`);
}

generateAllImages().catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
