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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Image dimensions
const TWITTER_WIDTH = 1200;
const TWITTER_HEIGHT = 675;
const INSTAGRAM_WIDTH = 1080;
const INSTAGRAM_HEIGHT = 1920;

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
 */
function parsePreTranslated(text) {
  const segments = [];
  const markerRegex = /\[\[MARKER:([^:]+):([^:]+):([^\|]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = markerRegex.exec(text)) !== null) {
    // Add text before marker
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        text: text.substring(lastIndex, match.index),
      });
    }

    const [, type, key, original, translatedValue] = match;
    segments.push({
      type: 'translated',
      text: translatedValue,
      original: original,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Translate text and track original values for strikethrough
 * Now uses core translation logic
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

  const segments = [];
  let lastIndex = 0;
  let sourceCounter = 1;

  // Process all markers
  const markerRegex = /\{\{([^:}]+):([^}]+)\}\}/g;
  let match;

  while ((match = markerRegex.exec(text)) !== null) {
    // Add text before marker
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        text: text.substring(lastIndex, match.index),
      });
    }

    const [fullMatch, type, key] = match;
    const marker = markers[key];

    // Handle sources specially
    if (type === 'source') {
      segments.push({
        type: 'source',
        text: `[${sourceCounter}]`,
      });
      sourceCounter++;
      lastIndex = match.index + fullMatch.length;
      continue;
    }

    if (!marker) {
      segments.push({ type: 'text', text: fullMatch });
      lastIndex = match.index + fullMatch.length;
      continue;
    }

    // Use core translation function
    const result = translateMarker(key, marker, translationData, storyId);

    if (result.original && result.translated !== result.original) {
      segments.push({
        type: 'translated',
        text: result.translated,
        original: result.original,
      });
    } else {
      segments.push({
        type: 'text',
        text: result.translated,
      });
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Draw text with segments (handling strikethrough originals and sources)
 * Returns final Y position reached
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

      if (currentX + width > x + maxWidth) {
        currentX = x;
        currentY += lineHeight;
      }

      ctx.fillText(segment.text, currentX, currentY);
      currentX += width + spaceWidth;
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

    } else if (segment.type === 'translated' && segment.original) {
      // Draw strikethrough original
      ctx.fillStyle = colors.strikethrough;
      const originalWidth = ctx.measureText(segment.original).width;

      if (currentX + originalWidth > x + maxWidth) {
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

      if (currentX + translatedWidth > x + maxWidth) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(segment.text, currentX, currentY);
      }
      currentX += translatedWidth + spaceWidth;

      ctx.fillStyle = colors.textMuted;

    } else {
      // Regular text - handle paragraph breaks
      let text = segment.text;

      // Check for paragraph breaks at start (double or more newlines)
      const leadingBreaks = text.match(/^(\n\n+)/);
      if (leadingBreaks && currentX > x) {
        // Start new paragraph
        currentX = x;
        currentY += lineHeight * 2; // Full paragraph spacing
        text = text.replace(/^(\n\n+)/, ''); // Remove leading breaks
      } else if (text.startsWith('\n') && currentX > x) {
        // Single newline - just wrap to next line
        currentX = x;
        currentY += lineHeight;
        text = text.replace(/^\n/, '');
      }

      // Now process the text for internal paragraph breaks
      if (text.includes('\n\n')) {
        const paragraphs = text.split(/\n\n+/);
        for (let i = 0; i < paragraphs.length; i++) {
          const para = paragraphs[i].trim();
          if (para) {
            // Process paragraph words
            const words = para.split(/\s+/).filter(w => w);
            ctx.fillStyle = colors.textMuted;

            for (const word of words) {
              if (!word) continue;
              const wordWidth = ctx.measureText(word).width;

              if (currentX + wordWidth > x + maxWidth && currentX > x) {
                currentX = x;
                currentY += lineHeight;
              }

              if (currentY <= maxHeight) {
                ctx.fillText(word, currentX, currentY);
              }
              currentX += wordWidth + spaceWidth;
            }
          }

          // Add paragraph spacing between paragraphs
          if (i < paragraphs.length - 1 && currentY <= maxHeight) {
            currentX = x;
            currentY += lineHeight * 2;
          }
        }
      } else {
        // Single paragraph - split by spaces
        const words = text.split(/\s+/).filter(w => w);
        ctx.fillStyle = colors.textMuted;

        for (const word of words) {
          if (!word) continue;
          const wordWidth = ctx.measureText(word).width;

          if (currentX + wordWidth > x + maxWidth && currentX > x) {
            currentX = x;
            currentY += lineHeight;
          }

          if (currentY <= maxHeight) {
            ctx.fillText(word, currentX, currentY);
          }
          currentX += wordWidth + spaceWidth;
        }
      }
    }
  }

  return currentY;
}

/**
 * Generate Twitter share image
 */
async function generateTwitterImage(story, outputPath, theme, countryCode, countryName, isTranslated = false) {
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
    ? parsePreTranslated(story.title)
    : translateWithOriginals(story.title, story.markers, countryCode, story.id);

  // Draw title with translation (increased from 48px to 56px)
  ctx.font = 'bold 56px "JetBrains Mono", monospace';
  let yPos = 80;
  const titleEndY = drawSegmentedText(ctx, titleSegments, 60, yPos, TWITTER_WIDTH - 120, yPos + 150, colors, 56);
  yPos = titleEndY + 60; // Increased gap between title and content

  // Translate and draw content (preserve paragraphs)
  const contentSegments = isTranslated
    ? parsePreTranslated(story.content)
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
async function generateInstagramImage(story, outputPath, theme, countryCode, countryName, isTranslated = false) {
  const canvas = createCanvas(INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);
  const ctx = canvas.getContext('2d');
  const colors = THEMES[theme];

  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, INSTAGRAM_HEIGHT);

  // Red accent bar
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, INSTAGRAM_WIDTH, 12);

  // Footer positioning - fixed at bottom
  const footerHeight = 280;
  const footerY = INSTAGRAM_HEIGHT - footerHeight + 20;
  const contentMaxY = footerY - 100; // Leave space for gradient

  // Translate title - use parsePreTranslated if story is pre-translated
  const titleSegments = isTranslated
    ? parsePreTranslated(story.title)
    : translateWithOriginals(story.title, story.markers, countryCode, story.id);

  // Draw title with translation (increased from 52px to 64px)
  ctx.font = 'bold 64px "JetBrains Mono", monospace';
  let yPos = 120;
  const titleEndY = drawSegmentedText(ctx, titleSegments, 60, yPos, INSTAGRAM_WIDTH - 120, yPos + 220, colors, 64);
  yPos = titleEndY + 70; // Increased gap between title and content

  // Translate and draw content (preserve paragraphs)
  const contentSegments = isTranslated
    ? parsePreTranslated(story.content)
    : translateWithOriginals(
        story.content,
        story.markers,
        countryCode,
        story.id
      );

  drawSegmentedText(ctx, contentSegments, 60, yPos, INSTAGRAM_WIDTH - 120, contentMaxY, colors, 34); // Increased from 28px to 34px

  // Gradient blur overlay
  const gradient = ctx.createLinearGradient(0, contentMaxY - 100, 0, contentMaxY + 20);
  gradient.addColorStop(0, colors.background + '00'); // Transparent
  gradient.addColorStop(1, colors.background); // Solid
  ctx.fillStyle = gradient;
  ctx.fillRect(0, contentMaxY - 100, INSTAGRAM_WIDTH, 120);

  // Footer
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText(`Translated for ${countryName}`, 60, footerY);

  ctx.fillStyle = colors.textMuted;
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText(`${story.date} • ${story.severity}`, 60, footerY + 40);

  // Hashtags
  if (story.hashtags) {
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText(story.hashtags, 60, footerY + 75);
  }

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText('Read the full story →', 60, footerY + 115);

  ctx.fillStyle = colors.textMuted;
  ctx.font = '20px "JetBrains Mono", monospace';
  ctx.fillText('Swipe up to learn more', 60, footerY + 150);

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
              story = yaml.load(translatedContent);
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
            await generateTwitterImage(story, twitterPath, theme, country.code, country.name, isTranslated);

            const instagramPath = path.join(
              instagramDir,
              `${story.slug}-${lang}-${country.code.toLowerCase()}-${theme}.png`
            );
            await generateInstagramImage(story, instagramPath, theme, country.code, country.name, isTranslated);

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
