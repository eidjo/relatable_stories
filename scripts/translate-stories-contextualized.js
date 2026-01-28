/**
 * Contextualized story translation script
 *
 * Flow:
 * 1. Load English story with markers
 * 2. For each target country (US, FR, BE, CZ, etc.):
 *    - Substitute markers with that country's context (names, places, numbers)
 *    - For each of that country's languages:
 *      - Translate the contextualized story to that language
 *      - Save as story.{lang}-{country}.yaml
 *
 * Example outputs:
 *   - story.en-us.yaml  (English text + US context)
 *   - story.fr-fr.yaml  (French text + French context)
 *   - story.fr-be.yaml  (French text + Belgian context)
 *   - story.nl-be.yaml  (Dutch text + Belgian context)
 *   - story.cs-cz.yaml  (Czech text + Czech context)
 *
 * Usage:
 *   npm run translate-contextualized
 *   npm run translate-contextualized -- --country=CZ
 *   npm run translate-contextualized -- --story=mahsa-arrest
 *   npm run translate-contextualized -- --country=CZ --force    # Overwrite existing files
 *   npm run translate-contextualized -- --story=mahsa-arrest -f  # Short form
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { existsSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Parse CLI arguments
const args = process.argv.slice(2);
const targetCountry = args.find(arg => arg.startsWith('--country='))?.split('=')[1];
const targetStory = args.find(arg => arg.startsWith('--story='))?.split('=')[1];
const forceOverwrite = args.includes('--force') || args.includes('-f');

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
  console.log('   Set it with: export ANTHROPIC_API_KEY=your-key-here');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Load country-language mappings
 */
async function loadCountryLanguages() {
  const content = await readFile('src/lib/data/contexts/country-languages.yaml', 'utf-8');
  return yaml.load(content);
}

/**
 * Load countries and their context data
 */
async function loadCountries() {
  const content = await readFile('src/lib/data/contexts/countries.yaml', 'utf-8');
  const data = yaml.load(content);
  return data.countries || data;
}

/**
 * Load name mappings
 */
async function loadNames() {
  const content = await readFile('src/lib/data/contexts/names.yaml', 'utf-8');
  return yaml.load(content);
}

/**
 * Load place mappings
 */
async function loadPlaces() {
  const content = await readFile('src/lib/data/contexts/places.yaml', 'utf-8');
  return yaml.load(content);
}

/**
 * Get original Iranian value for a marker
 */
function getOriginalValue(marker) {
  switch (marker.type) {
    case 'person':
      return marker.name || '[Iranian name]';
    case 'place':
      return marker.original || '[Iranian location]';
    case 'number':
      return marker.base.toString();
    case 'currency':
      return `${marker.base.toLocaleString()} Rial`;
    case 'date':
    case 'time':
    case 'event':
      return marker.value || '[original]';
    case 'occupation':
      return marker.original || marker.category || '[occupation]';
    case 'subject':
      return marker.category || '[subject]';
    default:
      return '[original]';
  }
}

/**
 * Substitute markers in text with contextualized values wrapped in special markers
 */
function substituteMarkers(text, markers, context, storyId) {
  let result = text;
  const { countryCode, names, places, population, currencySymbol, rialToLocal } = context;

  // Seeded random for deterministic selection
  function seededRandom(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 1000) / 1000;
  }

  function selectFromArray(items, seed) {
    const index = Math.floor(seededRandom(seed) * items.length);
    return items[index];
  }

  // Find all markers in text
  // Allow hyphens in marker keys (e.g., main-square, arrest-date)
  const markerRegex = /\{\{([\w-]+):([\w-]+)\}\}/g;
  let match;

  while ((match = markerRegex.exec(text)) !== null) {
    const [fullMatch, markerType, markerKey] = match;
    const marker = markers[markerKey];

    if (!marker) continue;

    const seed = `${storyId}-${markerKey}-${countryCode}`;
    let value = fullMatch; // Default to keeping marker
    const originalValue = getOriginalValue(marker);

    switch (marker.type) {
      case 'person': {
        const nameList = names[marker.gender] || names.neutral || ['Person'];
        value = selectFromArray(nameList, seed);
        break;
      }

      case 'place': {
        let placeKey = marker.category;
        if (marker.size) {
          placeKey = `${marker.category}-${marker.size}`;
        }
        if (marker.category === 'landmark' && marker.significance === 'protest-location') {
          placeKey = 'landmark-protest';
        }
        const placeList = places[placeKey] || places['city-medium'] || ['Location'];
        value = selectFromArray(placeList, seed);
        break;
      }

      case 'number': {
        let numValue = marker.base;
        if (marker.scale && marker['scale-factor']) {
          const iranPopulation = 88550570;
          const ratio = population / iranPopulation;
          numValue = Math.round(numValue * ratio * marker['scale-factor']);
        }
        if (marker.variance) {
          const seedValue = seededRandom(seed);
          const adjustment = Math.floor((seedValue - 0.5) * 2 * marker.variance);
          numValue += adjustment;
        }
        value = numValue.toString();
        break;
      }

      case 'currency': {
        const converted = Math.round(marker.base * rialToLocal);
        value = `${currencySymbol}${converted.toLocaleString('en-US')}`;
        break;
      }

      case 'date':
      case 'time':
      case 'event':
        value = marker.value || marker.translation || fullMatch;
        // Keep markers for dates/times/events as they shouldn't show tooltips
        result = result.replace(fullMatch, fullMatch);
        continue;

      case 'occupation': {
        if (marker.examples && marker.examples.length > 0) {
          value = selectFromArray(marker.examples, seed);
        } else {
          value = marker.original || marker.category || 'worker';
        }
        break;
      }

      case 'subject': {
        if (marker.examples && marker.examples.length > 0) {
          value = selectFromArray(marker.examples, seed);
        } else {
          value = marker.category || 'studies';
        }
        break;
      }

      case 'source':
      case 'image':
        // Keep these markers as-is
        continue;
    }

    // Wrap value in special marker that survives translation
    // Format: [[MARKER:type:key:original|value]]
    const markedValue = `[[MARKER:${marker.type}:${markerKey}:${originalValue}|${value}]]`;
    result = result.replace(fullMatch, markedValue);
  }

  return result;
}

/**
 * Translate a contextualized story to target language
 */
async function translateContextualizedStory(contextualizedContent, targetLangCode, targetLangName) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Translate this YAML story about Iran's uprising from English to ${targetLangName}.

CRITICAL RULES:
1. Translate ALL text content to ${targetLangName}
2. Apply proper grammar, conjugation, and case endings naturally
3. Keep emotional tone - this is about real people suffering
4. Maintain YAML structure exactly
5. Preserve field names (title, summary, content, markers, etc.)
6. Keep paragraph breaks (\\n\\n)
7. Keep the 'markers' section completely unchanged (it's metadata)
8. YAML ESCAPING: Properly escape special characters in YAML strings:
   - Use double quotes around strings with apostrophes/single quotes
   - Example: "Ema's house" not Ema's house
   - Strings with colons should be quoted: "Note: this is important"
   - Don't break YAML syntax - verify your output is valid YAML

SPECIAL MARKERS IN TEXT:
The text contains special markers in this format: [[MARKER:type:key:original|value]]

For example: [[MARKER:person:person1:Mahsa|Ema]]
- This represents the name "Ema" (Czech equivalent of Iranian "Mahsa")
- When translating, keep the MARKER structure but translate the value part
- Apply correct grammar/case to the translated value

Example:
  English: "[[MARKER:person:person1:Mahsa|Ema]]'s house"
  ${targetLangName}: "[[MARKER:person:person1:Mahsa|Emina]] dům" (if Czech - apply possessive case)

The marker format must remain: [[MARKER:type:key:original|TRANSLATED_VALUE]]
Only change TRANSLATED_VALUE - keep everything else identical!

YAML to translate:
${contextualizedContent}

Return ONLY valid YAML with proper escaping, no explanations.`
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error(`   ❌ Translation failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🌍 Contextualized Story Translation Tool\n');

  if (forceOverwrite) {
    console.log('⚠️  Force mode enabled - will overwrite existing files\n');
  }

  // Load configuration
  const countryLanguages = await loadCountryLanguages();
  const countries = await loadCountries();
  const allNames = await loadNames();
  const allPlaces = await loadPlaces();

  // Find stories
  const storyPattern = targetStory
    ? `src/lib/data/stories/${targetStory}/story.yaml`
    : 'src/lib/data/stories/*/story.yaml';
  const storyFiles = await glob(storyPattern);

  if (storyFiles.length === 0) {
    console.error(`❌ No stories found matching: ${storyPattern}`);
    process.exit(1);
  }

  console.log(`📚 Found ${storyFiles.length} story/stories\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const storyFile of storyFiles) {
    const storyId = path.basename(path.dirname(storyFile));
    const storyDir = path.dirname(storyFile);

    console.log(`📖 ${storyId}`);

    const originalContent = await readFile(storyFile, 'utf-8');
    const storyData = yaml.load(originalContent);

    // Filter countries
    const countriesToProcess = targetCountry
      ? countries.filter(c => c.code === targetCountry)
      : countries;

    for (const country of countriesToProcess) {
      const countryCode = country.code;
      const countryName = country.name;
      const languages = countryLanguages.countries[countryCode]?.languages || ['en'];

      const names = allNames[countryCode] || allNames['US'];
      const places = allPlaces[countryCode] || allPlaces['US'];

      const context = {
        countryCode,
        names,
        places,
        population: country.population,
        currencySymbol: country['currency-symbol'],
        rialToLocal: country['rial-to-local'],
      };

      // Substitute markers with this country's context
      const contextualizedData = {
        ...storyData,
        title: substituteMarkers(storyData.title, storyData.markers, context, storyId),
        summary: substituteMarkers(storyData.summary, storyData.markers, context, storyId),
        content: substituteMarkers(storyData.content, storyData.markers, context, storyId),
      };

      for (const langCode of languages) {
        // Skip English - original stories are already in English
        // Runtime translation with country context handles English
        if (langCode === 'en') {
          continue;
        }

        const langName = countryLanguages.language_names[langCode] || langCode;
        const outputFilename = `story.${langCode}-${countryCode.toLowerCase()}.yaml`;
        const outputPath = path.join(storyDir, outputFilename);

        // Skip if already exists (unless --force flag is set)
        if (existsSync(outputPath) && !forceOverwrite) {
          console.log(`   ⏭️  ${langName} (${countryName}) - already exists (use --force to overwrite)`);
          totalSkipped++;
          continue;
        }

        // Log if overwriting
        if (existsSync(outputPath) && forceOverwrite) {
          console.log(`   🔄 ${langName} (${countryName}) - overwriting existing file`);
        }

        // Translate to target language
        const contextualizedYaml = yaml.dump(contextualizedData, {
          lineWidth: -1,
          noRefs: true,
          quotingType: '"',  // Use double quotes for better escaping
          forceQuotes: false, // Only quote when necessary
        });

        const translated = await translateContextualizedStory(
          contextualizedYaml,
          langCode,
          langName
        );

        if (translated) {
          // Strip markdown code blocks if present
          let cleanedTranslation = translated.trim();
          if (cleanedTranslation.startsWith('```yaml')) {
            cleanedTranslation = cleanedTranslation.replace(/^```yaml\n/, '').replace(/\n```$/, '');
          } else if (cleanedTranslation.startsWith('```')) {
            cleanedTranslation = cleanedTranslation.replace(/^```\n/, '').replace(/\n```$/, '');
          }

          // Keep [[MARKER:...]] format in the output
          // The UI will need a special parser to handle pre-translated stories
          // Format: [[MARKER:type:key:original|translatedValue]]
          // This preserves both the translated text (with correct grammar) and original for tooltips

          // Remove the markers section since metadata is now inline
          let translatedData;
          try {
            translatedData = yaml.load(cleanedTranslation);
          } catch (parseError) {
            console.log(`   ❌ ${langName} (${countryName}) - YAML parsing failed`);
            console.log(`      Error: ${parseError.message}`);
            console.log(`      First 200 chars: ${cleanedTranslation.substring(0, 200)}`);
            totalFailed++;
            continue;
          }

          delete translatedData.markers;
          const finalYaml = yaml.dump(translatedData, {
            lineWidth: -1,
            noRefs: true,
            quotingType: '"',  // Use double quotes for better escaping
            forceQuotes: false, // Only quote when necessary
          });

          await writeFile(outputPath, finalYaml, 'utf-8');
          console.log(`   ✅ ${langName} (${countryName}) - translated`);
          totalGenerated++;
        } else {
          console.log(`   ❌ ${langName} (${countryName}) - failed`);
          totalFailed++;
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Generated: ${totalGenerated}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (totalFailed > 0) {
    console.log('\n⚠️  Some translations failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
