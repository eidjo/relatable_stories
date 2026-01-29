/**
 * Generate social media share images using the translation pipeline
 * Dark theme only, simplified and maintainable
 */

import { GlobalFonts } from '@napi-rs/canvas';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translateStory } from '../src/lib/translation/pipeline.ts';
import { renderTwitterImage, renderInstagramImage } from './renderers/canvas-renderer.js';
import { format } from 'date-fns';
import { enUS, cs, fr, de, es, it, nl, sv, nb, da, fi, pl, pt } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
  } catch (_error) {
    return dateString;
  }
}

// Load JetBrains Mono font
const fontPath = path.join(rootDir, 'static', 'fonts', 'JetBrainsMono-Regular.ttf');
try {
  GlobalFonts.registerFromPath(fontPath, 'JetBrains Mono');
  console.log('✓ JetBrains Mono font loaded');
} catch (error) {
  console.error('Failed to load font:', error);
  process.exit(1);
}

// Stories to generate
const STORIES = ['raha-2026', 'mahsa-arrest'];

// Countries and their languages (from country-languages.yaml)
const COUNTRY_LANGUAGES = {
  US: ['en'],
  CZ: ['cs', 'en'],
  FR: ['fr', 'en'],
  DE: ['de', 'en'],
  ES: ['es', 'en'],
  IT: ['it', 'en'],
  NL: ['nl', 'en'],
  SE: ['sv', 'en'],
  NO: ['no', 'en'],
  DK: ['da', 'en'],
  FI: ['fi', 'en'],
  PL: ['pl', 'en'],
  PT: ['pt', 'en'],
  BR: ['pt', 'en'],
  CA: ['en', 'fr'],
  BE: ['nl', 'fr', 'de', 'en'],
  GR: ['el', 'en'],
  IR: ['fa', 'en'],
};

/**
 * Generate Twitter image for a story/country/language combo
 */
async function generateTwitterImage(storySlug, countryCode, languageCode, outputDir) {
  // Translate story using pipeline
  const translatedStory = await translateStory({
    storySlug,
    country: countryCode,
    language: languageCode,
    contextualizationEnabled: true,
  });

  // Format date
  const formattedDate = formatDateLocalized(translatedStory.date, languageCode);

  // Render to canvas
  const canvas = renderTwitterImage(translatedStory, formattedDate);

  // Save to file
  const filename = `${storySlug}-${languageCode}-${countryCode.toLowerCase()}-dark.png`;
  const outputPath = path.join(outputDir, filename);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

/**
 * Generate Instagram image for a story/country/language combo
 */
async function generateInstagramImage(storySlug, countryCode, languageCode, outputDir) {
  // Translate story using pipeline
  const translatedStory = await translateStory({
    storySlug,
    country: countryCode,
    language: languageCode,
    contextualizationEnabled: true,
  });

  // Format date
  const formattedDate = formatDateLocalized(translatedStory.date, languageCode);

  // Render to canvas
  const canvas = renderInstagramImage(translatedStory, formattedDate);

  // Save to file
  const filename = `${storySlug}-${languageCode}-${countryCode.toLowerCase()}-dark.png`;
  const outputPath = path.join(outputDir, filename);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}

/**
 * Generate all share images
 */
async function generateAllImages() {
  console.log('🎨 Generating share images using pipeline...\n');

  // Ensure output directories exist
  const twitterDir = path.join(rootDir, 'static', 'share', 'twitter');
  const instagramDir = path.join(rootDir, 'static', 'share', 'instagram');

  await fs.mkdir(twitterDir, { recursive: true });
  await fs.mkdir(instagramDir, { recursive: true });

  let totalGenerated = 0;

  // Generate for each story
  for (const storySlug of STORIES) {
    // Generate for each country and its languages
    for (const [countryCode, languages] of Object.entries(COUNTRY_LANGUAGES)) {
      for (const languageCode of languages) {
        try {
          // Generate Twitter image
          await generateTwitterImage(storySlug, countryCode, languageCode, twitterDir);

          // Generate Instagram image
          await generateInstagramImage(storySlug, countryCode, languageCode, instagramDir);

          totalGenerated += 2;
          process.stdout.write('.');
        } catch (error) {
          console.error(`\n❌ Error: ${storySlug}/${countryCode}/${languageCode}:`, error.message);
        }
      }
    }
  }

  console.log(`\n✅ Done! Generated ${totalGenerated} images`);
  console.log(`  Twitter: ${twitterDir}`);
  console.log(`  Instagram: ${instagramDir}`);
}

// Run
generateAllImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
