/**
 * Story translation script with contextualization - V2 Marker System
 *
 * This script translates Iranian stories into multiple languages with proper
 * grammatical handling. It substitutes markers with country-specific context,
 * then translates everything (including both original and local values) so that
 * grammatical cases work correctly in languages like Czech, Polish, Finnish, etc.
 *
 * Flow:
 * 1. Load English story with V2 markers
 * 2. For each target country:
 *    - Substitute markers with that country's context (names, places, numbers)
 *    - For each of that country's languages:
 *      - Translate the story to that language with proper grammar
 *      - Save as story.{lang}-{country}.yaml
 *
 * Example outputs:
 *   - story.fr-fr.yaml  (French text + French context)
 *   - story.nl-be.yaml  (Dutch text + Belgian context)
 *   - story.cs-cz.yaml  (Czech text + Czech context with proper cases)
 *
 * Usage:
 *   npm run translate                           # Translate all stories to all languages
 *   npm run translate -- --country=CZ           # Translate for Czech Republic only
 *   npm run translate -- --lang=cs              # Translate to Czech for all countries that have it
 *   npm run translate -- --story=mahsa-arrest   # Translate one story only
 *   npm run translate -- --story=mahsa-arrest --lang=cs -f  # Specific story, language, force overwrite
 *   npm run translate -- --country=CZ --force   # Overwrite existing files
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { existsSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Import V2 type detection functions
import {
  getMarkerType,
  isPersonMarker,
  isPlaceMarker,
  isNumberMarker,
  isCasualtiesMarker,
  isAliasMarker,
} from '../src/lib/types/index.ts';

// Import schema-driven helpers
import { getPlaceFacilityTypes, getNestedValue } from '../src/lib/translation/schema-helpers.ts';

// Parse CLI arguments
const args = process.argv.slice(2);
const targetCountry = args.find((arg) => arg.startsWith('--country='))?.split('=')[1];
const targetStory = args.find((arg) => arg.startsWith('--story='))?.split('=')[1];
const targetLang = args.find((arg) => arg.startsWith('--lang='))?.split('=')[1];
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
 * Load place mappings (V2)
 */
async function loadPlaces() {
  const content = await readFile('src/lib/data/contexts/places.yaml', 'utf-8');
  return yaml.load(content);
}

/**
 * Load comparable events
 */
async function loadComparableEvents() {
  const content = await readFile('src/lib/data/contexts/comparable-events.yaml', 'utf-8');
  return yaml.load(content);
}

/**
 * Get original Iranian value for a V2 marker
 */
function getOriginalValue(marker) {
  if (isPersonMarker(marker)) {
    return marker.person;
  }
  if (isPlaceMarker(marker)) {
    return marker.place;
  }
  if (isNumberMarker(marker)) {
    return marker.number.toString();
  }
  if (isCasualtiesMarker(marker)) {
    return marker.casualties.toString();
  }
  if ('date' in marker) {
    return marker.date;
  }
  if ('time' in marker) {
    return marker.time;
  }
  if ('currency' in marker) {
    return `${marker.currency.toLocaleString()} Rial`;
  }
  if ('occupation' in marker) {
    return marker.occupation || '[occupation]';
  }
  if ('text' in marker) {
    return marker.text;
  }
  return '[original]';
}

/**
 * Substitute markers in text with contextualized values wrapped in special markers
 */
function substituteMarkers(text, markers, context, resolvedMarkers, storyId) {
  let result = text;
  const { countryCode, names, places, population, currencySymbol, rialToLocal, comparableEvents } =
    context;

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
    if (!items || items.length === 0) return '[not found]';
    const index = Math.floor(seededRandom(seed) * items.length);
    return items[index];
  }

  // V2 regex: matches {{key}} or {{key:suffix}}
  const markerRegex = /\{\{([\w-]+)(?::([\w-]+))?\}\}/g;
  let match;

  // Store matches to process them in order
  const matches = [];
  while ((match = markerRegex.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      key: match[1],
      suffix: match[2],
      index: match.index,
    });
  }

  // Process matches in reverse order to preserve indices
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, key, suffix, index } = matches[i];

    // Handle special cases: source and image references
    if (key === 'source' || key === 'image') {
      // Keep these as-is, they'll be handled by the translator
      continue;
    }

    const marker = markers[key];
    if (!marker) {
      console.warn(`Warning: Marker not found: ${key}`);
      continue;
    }

    const seed = `${storyId}-${key}-${countryCode}`;
    let value = fullMatch; // Default to keeping marker
    let originalValue = getOriginalValue(marker);
    let markerType = getMarkerType(marker);
    let effectiveKey = key; // Key to use in marker output

    // Handle suffixes FIRST before general marker processing
    if (suffix === 'age' && isPersonMarker(marker) && marker.age) {
      // {{person:age}} - just output the age number, no marker needed
      value = marker.age.toString();
      result = result.substring(0, index) + value + result.substring(index + fullMatch.length);
      continue;
    }

    if (suffix === 'comparable' && isCasualtiesMarker(marker)) {
      // {{killed:comparable}} - output comparison text
      // We need to compute the scaled casualties and find a comparison
      const iranPop = 85000000;
      let targetPop = population;

      if (marker.scope === 'city' && marker.scopeCity) {
        const cityMarker = markers[marker.scopeCity];
        if (cityMarker && 'population' in cityMarker) {
          targetPop = cityMarker.population;
          if (resolvedMarkers.has(marker.scopeCity)) {
            const translatedCityName = resolvedMarkers.get(marker.scopeCity);
            const translatedCity = places.cities?.find((c) => c.name === translatedCityName);
            if (translatedCity?.population) {
              targetPop = translatedCity.population;
            }
          }
        }
      }

      const scaledValue = Math.round(marker.casualties * (targetPop / iranPop));

      // Find comparable event if specified
      let comparisonText = '';
      let comparisonExplanation = '';
      if (marker.comparable && comparableEvents) {
        const countryEvents = comparableEvents;
        const category = marker.comparable === 'any' ? null : marker.comparable;

        // Find closest event
        let candidates = countryEvents;
        if (category) {
          const filtered = countryEvents.filter((e) => e.category === category);
          if (filtered.length > 0) candidates = filtered;
        }

        if (candidates.length > 0) {
          const closestEvent = candidates.reduce((best, current) => {
            const bestDiff = Math.abs(best.casualties - scaledValue);
            const currentDiff = Math.abs(current.casualties - scaledValue);
            return currentDiff < bestDiff ? current : best;
          });

          const exactRatio = scaledValue / closestEvent.casualties;
          const eventName = closestEvent.name.trim();

          // Within 15% margin (0.85-1.15x) - say "approximately"
          if (exactRatio >= 0.85 && exactRatio <= 1.15) {
            comparisonText = `(approximately ${closestEvent.fullName || eventName})`;
          }
          // Fractional comparisons (less than the event)
          else if (exactRatio < 0.85) {
            let fractionPhrase;
            if (exactRatio <= 0.35) {
              fractionPhrase = 'a third of';
            } else if (exactRatio <= 0.55) {
              fractionPhrase = 'half of';
            } else {
              fractionPhrase = 'two-thirds of';
            }
            comparisonText = `(${fractionPhrase} ${closestEvent.fullName || eventName})`;
          }
          // Multiple times more (greater than the event)
          else {
            const multiplier = Math.round(exactRatio);
            let times;
            if (multiplier === 2) {
              times = 'twice';
            } else if (multiplier === 3) {
              times = 'three times';
            } else {
              times = `${multiplier} times`;
            }
            comparisonText = `(${times} the ${eventName})`;
          }

          // Generate comparison explanation
          const ratioText =
            exactRatio >= 1
              ? `${exactRatio.toFixed(2)}x more`
              : `${(exactRatio * 100).toFixed(0)}% of`;
          comparisonExplanation = `Comparison: ${scaledValue.toLocaleString()} casualties vs. ${eventName} (${closestEvent.casualties.toLocaleString()} casualties in ${closestEvent.year}) = ${ratioText}`;
        }
      }

      // Output comparison text with explanation embedded
      // Format: [[COMPARISON:original|translated|explanation]]
      value = comparisonText || `(comparison unavailable)`;
      const comparisonMarked = comparisonExplanation
        ? `[[COMPARISON:${comparisonText}|${comparisonText}|${comparisonExplanation}]]`
        : comparisonText;
      result =
        result.substring(0, index) + comparisonMarked + result.substring(index + fullMatch.length);
      continue;
    }

    if (suffix === 'original' || suffix === 'translated') {
      // These suffixes control display mode, not substitution
      // Just proceed with normal substitution but note the suffix
    }

    // Handle aliases first
    if (isAliasMarker(marker)) {
      const targetKey = marker.sameAs;
      const targetMarker = markers[targetKey];

      if (!targetMarker) {
        console.warn(`Warning: Alias target marker not found: ${targetKey}`);
        continue;
      }

      // Use target marker's type and original value
      markerType = getMarkerType(targetMarker);
      originalValue = getOriginalValue(targetMarker);
      effectiveKey = targetKey; // Use target key in marker output

      if (resolvedMarkers.has(targetKey)) {
        value = resolvedMarkers.get(targetKey);
      } else {
        // Target not resolved yet - recursively resolve it
        const targetSeed = `${storyId}-${targetKey}-${countryCode}`;

        if (isPersonMarker(targetMarker)) {
          const nameList =
            targetMarker.gender === 'm'
              ? names.male
              : targetMarker.gender === 'f'
                ? names.female
                : names.neutral;
          value = selectFromArray(nameList, targetSeed);
        } else if (isPlaceMarker(targetMarker)) {
          // Simplified place resolution for aliases
          const size = targetMarker['city-large']
            ? 'large'
            : targetMarker['city-medium']
              ? 'medium'
              : targetMarker['city-small']
                ? 'small'
                : null;
          if (size && places.cities) {
            const cities = places.cities.filter(
              (c) => c.size === size && (!targetMarker.capital || c.capital)
            );
            if (cities.length > 0) {
              const selectedCity = selectFromArray(cities, targetSeed);
              value = selectedCity.name;
            }
          }
        }

        // Store the resolved target
        resolvedMarkers.set(targetKey, value);
      }
    }
    // Person markers
    else if (isPersonMarker(marker)) {
      const nameList =
        marker.gender === 'm' ? names.male : marker.gender === 'f' ? names.female : names.neutral;
      value = selectFromArray(nameList, seed);
    }
    // Place markers with V2 hierarchical support
    else if (isPlaceMarker(marker)) {
      // Resolve parent on-demand if needed
      if (marker.within && !resolvedMarkers.has(marker.within)) {
        const parentMarker = markers[marker.within];
        if (parentMarker && isPlaceMarker(parentMarker)) {
          // Recursively resolve parent (city markers don't have parents themselves)
          const parentSeed = `${storyId}-${marker.within}-${countryCode}`;
          const parentSize = parentMarker['city-large']
            ? 'large'
            : parentMarker['city-medium']
              ? 'medium'
              : parentMarker['city-small']
                ? 'small'
                : null;

          if (parentSize && places.cities) {
            const cities = places.cities.filter(
              (c) => c.size === parentSize && (!parentMarker.capital || c.capital)
            );
            if (cities.length > 0) {
              const selectedCity = selectFromArray(cities, parentSeed);
              resolvedMarkers.set(marker.within, selectedCity.name);
            }
          }
        }
      }

      // Check if this place has a parent
      if (marker.within && resolvedMarkers.has(marker.within)) {
        const parentCityName = resolvedMarkers.get(marker.within);

        // Find the city in places data
        const cityData = places.cities?.find((c) => c.name === parentCityName);
        if (cityData) {
          // Schema-driven facility matching
          const facilityTypes = getPlaceFacilityTypes();
          for (const { property, dataPath } of facilityTypes) {
            const markerHasType = marker[property] === true;
            const cityHasData = getNestedValue(cityData, dataPath);

            if (markerHasType && cityHasData && Array.isArray(cityHasData)) {
              value = selectFromArray(cityHasData, seed);
              break;
            }
          }
        }
      }

      // If no parent or not resolved, use direct city selection
      if (value === fullMatch) {
        const size = marker['city-large']
          ? 'large'
          : marker['city-medium']
            ? 'medium'
            : marker['city-small']
              ? 'small'
              : null;

        if (size && places.cities) {
          // Filter by size AND capital requirement (if specified)
          const cities = places.cities.filter(
            (c) => c.size === size && (!marker.capital || c.capital)
          );
          if (cities.length > 0) {
            const selectedCity = selectFromArray(cities, seed);
            value = selectedCity.name;
          }
        } else {
          // Fallback to generic lists
          if (marker['landmark-protest'] && places.generic?.landmarks?.protest) {
            value = selectFromArray(places.generic.landmarks.protest, seed);
          } else if (marker.university && places.generic?.universities) {
            value = selectFromArray(places.generic.universities, seed);
          } else if (marker['government-facility'] && places.generic?.['government-facilities']) {
            value = selectFromArray(places.generic['government-facilities'], seed);
          }
        }
      }
    }
    // Number markers
    else if (isNumberMarker(marker)) {
      let numValue = marker.number;
      if (marker.scaled) {
        const iranPopulation = 85000000;
        const ratio = population / iranPopulation;
        const scaleFactor = marker.scaleFactor || 1.0;
        numValue = Math.round(numValue * ratio * scaleFactor);
      }
      if (marker.variance) {
        const seedValue = seededRandom(seed);
        const adjustment = Math.floor((seedValue - 0.5) * 2 * marker.variance);
        numValue += adjustment;
      }
      value = numValue.toString();
    }
    // Casualties markers
    else if (isCasualtiesMarker(marker)) {
      const iranPop = 85000000;
      let targetPop = population;

      // Handle city-scoped casualties
      if (marker.scope === 'city' && marker.scopeCity) {
        const cityMarker = markers[marker.scopeCity];
        if (cityMarker && 'population' in cityMarker) {
          targetPop = cityMarker.population;

          // If the city has been resolved, use translated city's population
          if (resolvedMarkers.has(marker.scopeCity)) {
            const translatedCityName = resolvedMarkers.get(marker.scopeCity);
            const translatedCity = places.cities?.find((c) => c.name === translatedCityName);
            if (translatedCity?.population) {
              targetPop = translatedCity.population;
            }
          }
        }
      }

      const scaledValue = Math.round(marker.casualties * (targetPop / iranPop));
      value = scaledValue.toString();
    }
    // Currency markers
    else if ('currency' in marker) {
      const converted = Math.round(marker.currency * rialToLocal);
      value = `${currencySymbol}${converted.toLocaleString('en-US')}`;
    }
    // Date markers
    else if ('date' in marker) {
      value = marker.date;
    }
    // Time markers
    else if ('time' in marker) {
      value = marker.time;
    }
    // Occupation markers
    else if ('occupation' in marker) {
      value = marker.occupation;
    }
    // Text markers (e.g., chants, events)
    else if ('text' in marker) {
      value = marker.text;
    }

    // Store resolved value for aliases and the original key
    resolvedMarkers.set(key, value);
    if (effectiveKey !== key) {
      resolvedMarkers.set(effectiveKey, value); // Also store target key for alias resolution
    }

    // Build explanation if applicable
    let explanation = '';

    // For scaled numbers, add scaling explanation
    if (isNumberMarker(marker) && marker.scaled) {
      const iranPop = 85000000;
      const _ratio = population / iranPop;
      const scaleFactor = marker.scaleFactor || 1.0;
      explanation = `Scaled from Iran (${marker.number.toLocaleString()}) to ${countryCode} by population ratio: ${marker.number.toLocaleString()} × (${(population / 1000000).toFixed(1)}M / ${(iranPop / 1000000).toFixed(1)}M)${scaleFactor !== 1.0 ? ` × ${scaleFactor}` : ''} = ${value}`;
    }

    // For casualties, add scaling explanation
    if (isCasualtiesMarker(marker)) {
      const iranPop = 85000000;
      let targetPop = population;
      let scopeType = 'country';
      let scopeName = countryCode;

      if (marker.scope === 'city' && marker.scopeCity) {
        const cityMarker = markers[marker.scopeCity];
        if (cityMarker && 'population' in cityMarker) {
          targetPop = cityMarker.population;
          scopeType = 'city';
          if (resolvedMarkers.has(marker.scopeCity)) {
            const translatedCityName = resolvedMarkers.get(marker.scopeCity);
            const translatedCity = places.cities?.find((c) => c.name === translatedCityName);
            if (translatedCity?.population) {
              targetPop = translatedCity.population;
              scopeName = translatedCityName;
            }
          }
        }
      }

      explanation = `Scaled from Iran (${marker.casualties.toLocaleString()}) to ${scopeName} by ${scopeType} population: ${marker.casualties.toLocaleString()} × (${(targetPop / 1000000).toFixed(1)}M / ${(iranPop / 1000000).toFixed(1)}M) = ${value}`;
    }

    // Wrap value in special marker that survives translation
    // Format: [[MARKER:type:key:original|value|explanation]]
    const markedValue = explanation
      ? `[[MARKER:${markerType}:${effectiveKey}:${originalValue}|${value}|${explanation}]]`
      : `[[MARKER:${markerType}:${effectiveKey}:${originalValue}|${value}]]`;
    result = result.substring(0, index) + markedValue + result.substring(index + fullMatch.length);
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
      messages: [
        {
          role: 'user',
          content: `Translate this YAML story about Iran's uprising from English to ${targetLangName}.

CRITICAL RULES:
1. Translate ALL text content to ${targetLangName}
2. Apply proper grammar, conjugation, and case endings naturally
3. Keep emotional tone - this is about real people suffering
4. Maintain YAML structure exactly
5. Preserve field names (title, summary, content, sources, images, etc.)
6. Keep paragraph breaks (\\n\\n)
7. Keep the 'markers', 'sources', and 'images' sections completely unchanged (metadata)
8. YAML ESCAPING: Properly escape special characters in YAML strings:
   - Use double quotes around strings with apostrophes/single quotes
   - Example: "Ema's house" not Ema's house
   - Strings with colons should be quoted: "Note: this is important"
   - Don't break YAML syntax - verify your output is valid YAML

SPECIAL MARKERS IN TEXT:
The text contains special markers in these formats:

1. [[MARKER:type:key:original|value]] - Basic marker
2. [[MARKER:type:key:original|value|explanation]] - With explanation (math for tooltips)
3. [[COMPARISON:original|translated|explanation]] - Casualty comparisons

For example: [[MARKER:person:person1:Mahsa|Ema]]
- "Mahsa" = Iranian original name (currently in English)
- "Ema" = Local equivalent name (Czech)

YOU MUST TRANSLATE BOTH PARTS to ${targetLangName}:
1. Translate the original Iranian context (Mahsa, Tehran, etc.) with proper grammar
2. Translate the local equivalent (Ema, Prague, etc.) with proper grammar
3. Keep explanation field UNCHANGED (it's in English for tooltips)

IMPORTANT: Numbers in markers are already localized - DO NOT translate them:
  [[MARKER:number:cities:400|49]] - keep both numbers as-is
  [[MARKER:casualties:killed:36500|4513|Scaled from Iran...]] - keep numbers as is, but translate the explanation

Examples:
  English input: "in [[MARKER:place:hometown:Tehran|Prague]]"
  Czech output: "v [[MARKER:place:hometown:Teheránu|Praze]]"
  - "Teheránu" = Tehran translated to Czech with locative case (v + locative)
  - "Praze" = Prague translated to Czech with locative case (v + locative)

  English input: "[[MARKER:person:person1:Mahsa|Ema]]'s house"
  Czech output: "dům [[MARKER:person:person1:Mahsy|Emy]]"
  - "Mahsy" = Mahsa in Czech genitive case (possessive)
  - "Emy" = Ema in Czech genitive case (possessive)

  English input: "more than [[MARKER:casualties:killed:36500|4513|Scaled from Iran (36500) to CZ...]] people"
  Czech output: "více než [[MARKER:casualties:killed:36500|4513|Přepočítáno z Íránu (36 500) na Českou republiku...]] lidí"
  - Keep numbers and explanation unchanged

  English input: "[[COMPARISON:(13 times the Lidice massacre)|(13 times the Lidice massacre)|Comparison: 4513 casualties...]]"
  Czech output: "[[COMPARISON:(13 times the Lidice massacre)|(13krát více než masakr v Lidicích)|Srovnání: 4 513 obětí...]]"
  - Translate the comparison text (second part)
  - Translate the explanation (third part)

The marker format must remain:
- [[MARKER:type:key:TRANSLATED_ORIGINAL|TRANSLATED_LOCAL]] for basic markers
- [[MARKER:type:key:TRANSLATED_ORIGINAL|TRANSLATED_LOCAL|explanation]] for markers with math
- [[COMPARISON:original|TRANSLATED_TEXT|explanation]] for comparisons

Translate names and places with proper grammar/case!
Keep numbers unchanged!

YAML to translate:
${contextualizedContent}

Return ONLY valid YAML with proper escaping, no explanations.`,
        },
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error(`   ❌ Translation failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🌍 Contextualized Story Translation Tool (V2)\n');

  if (forceOverwrite) {
    console.log('⚠️  Force mode enabled - will overwrite existing files\n');
  }

  // Load configuration
  const countryLanguages = await loadCountryLanguages();
  const countries = await loadCountries();
  const allNames = await loadNames();
  const allPlaces = await loadPlaces();
  const allComparableEvents = await loadComparableEvents();

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
    let countriesToProcess = targetCountry
      ? countries.filter((c) => c.code === targetCountry)
      : countries;

    // If --lang is specified without --country, filter to countries that have that language
    if (targetLang && !targetCountry) {
      countriesToProcess = countriesToProcess.filter((country) => {
        const langs = countryLanguages.countries[country.code]?.languages || [];
        return langs.includes(targetLang);
      });

      if (countriesToProcess.length === 0) {
        console.error(`❌ No countries found with language code: ${targetLang}`);
        const availableLangs = Object.keys(countryLanguages.language_names || {}).filter(
          (l) => l !== 'en'
        );
        console.log(`Available languages: ${availableLangs.join(', ')}`);
        process.exit(1);
      }
    }

    for (const country of countriesToProcess) {
      const countryCode = country.code;
      const countryName = country.name;
      let languages = countryLanguages.countries[countryCode]?.languages || ['en'];

      // Filter to specific language if --lang is specified
      if (targetLang) {
        languages = languages.filter((lang) => lang === targetLang);
        if (languages.length === 0) {
          console.log(`   ⏭️  Skipping ${countryName} - language ${targetLang} not available`);
          continue;
        }
      }

      const names = allNames[countryCode] || allNames['US'];
      const places = allPlaces[countryCode] || allPlaces['US'];
      const comparableEvents = allComparableEvents[countryCode] || allComparableEvents['US'] || [];

      const context = {
        countryCode,
        names,
        places,
        population: country.population,
        currencySymbol: country['currency-symbol'],
        rialToLocal: country['rial-to-local'],
        comparableEvents,
      };

      // Substitute markers with this country's context
      const resolvedMarkers = new Map(); // Track resolved values for aliases
      const contextualizedData = {
        ...storyData,
        title: substituteMarkers(
          storyData.title,
          storyData.markers,
          context,
          resolvedMarkers,
          storyId
        ),
        summary: substituteMarkers(
          storyData.summary,
          storyData.markers,
          context,
          resolvedMarkers,
          storyId
        ),
        content: substituteMarkers(
          storyData.content,
          storyData.markers,
          context,
          resolvedMarkers,
          storyId
        ),
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
          console.log(
            `   ⏭️  ${langName} (${countryName}) - already exists (use --force to overwrite)`
          );
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
          quotingType: '"', // Use double quotes for better escaping
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
          // The UI will parse pre-translated stories with proper grammar

          // Remove the markers, sources, and images sections since metadata is now inline
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
          delete translatedData.sources;
          delete translatedData.images;

          const finalYaml = yaml.dump(translatedData, {
            lineWidth: -1,
            noRefs: true,
            quotingType: '"', // Use double quotes for better escaping
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
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

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
