#!/usr/bin/env tsx
/**
 * Validation script for V2 context data
 *
 * Validates:
 * - places-v2.yaml structure
 * - comparable-events.yaml data quality
 * - Story marker references
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';
import type { PlacesDataV2, CityData, ComparableEvent } from '../src/lib/translation/core-v2';
import type { Story } from '../src/lib/types';
import { getMarkerType, isPlaceMarker } from '../src/lib/types/markers-v2';

interface ValidationError {
  file: string;
  issue: string;
  severity: 'error' | 'warning';
}

const errors: ValidationError[] = [];

function addError(file: string, issue: string, severity: 'error' | 'warning' = 'error') {
  errors.push({ file, issue, severity });
}

/**
 * Validate places-v2.yaml structure
 */
async function validatePlaces() {
  console.log('📍 Validating places-v2.yaml...');

  try {
    const placesPath = join(process.cwd(), 'src/lib/data/contexts/places.yaml');
    const placesContent = await readFile(placesPath, 'utf8');
    const placesData = load(placesContent) as Record<string, PlacesDataV2>;

    for (const [countryCode, countryPlaces] of Object.entries(placesData)) {
      // Check cities array exists
      if (!countryPlaces.cities || countryPlaces.cities.length === 0) {
        addError('places-v2.yaml', `${countryCode}: Missing 'cities' array`, 'error');
        continue;
      }

      // Validate each city
      for (const city of countryPlaces.cities) {
        if (!city.name) {
          addError('places-v2.yaml', `${countryCode}: City missing 'name' field`, 'error');
        }

        if (!city.size || !['small', 'medium', 'large'].includes(city.size)) {
          addError('places-v2.yaml', `${countryCode}/${city.name}: Invalid or missing 'size'`, 'error');
        }

        if (typeof city.population !== 'number' || city.population <= 0) {
          addError('places-v2.yaml', `${countryCode}/${city.name}: Invalid 'population'`, 'warning');
        }

        // Check for protest locations (critical for stories)
        const protestLocations = city.landmarks?.protest || [];
        if (protestLocations.length === 0) {
          addError(
            'places-v2.yaml',
            `${countryCode}/${city.name}: No protest locations - stories won't work`,
            'error'
          );
        }

        // Check for at least one university
        if (!city.universities || city.universities.length === 0) {
          addError('places-v2.yaml', `${countryCode}/${city.name}: No universities defined`, 'warning');
        }

        // Check for government facilities
        if (!city['government-facilities'] || city['government-facilities'].length === 0) {
          addError(
            'places-v2.yaml',
            `${countryCode}/${city.name}: No government facilities defined`,
            'warning'
          );
        }
      }

      // Check generic fallbacks exist
      if (!countryPlaces.generic) {
        addError('places-v2.yaml', `${countryCode}: Missing 'generic' fallbacks`, 'warning');
      } else {
        if (!countryPlaces.generic.landmarks?.protest || countryPlaces.generic.landmarks.protest.length === 0) {
          addError('places-v2.yaml', `${countryCode}: No generic protest locations`, 'warning');
        }
      }
    }

    console.log(`  ✓ Validated ${Object.keys(placesData).length} countries`);
  } catch (error) {
    addError('places-v2.yaml', `Failed to load: ${error}`, 'error');
  }
}

/**
 * Validate comparable-events.yaml
 */
async function validateComparableEvents() {
  console.log('💥 Validating comparable-events.yaml...');

  try {
    const eventsPath = join(process.cwd(), 'src/lib/data/contexts/comparable-events.yaml');
    const eventsContent = await readFile(eventsPath, 'utf8');
    const eventsData = load(eventsContent) as Record<string, ComparableEvent[]>;

    for (const [countryCode, events] of Object.entries(eventsData)) {
      if (!Array.isArray(events) || events.length === 0) {
        addError('comparable-events.yaml', `${countryCode}: No events defined`, 'warning');
        continue;
      }

      for (const event of events) {
        if (!event.id) {
          addError('comparable-events.yaml', `${countryCode}: Event missing 'id'`, 'error');
        }

        if (!event.name) {
          addError('comparable-events.yaml', `${countryCode}/${event.id}: Missing 'name'`, 'error');
        }

        if (!event.casualties || event.casualties <= 0) {
          addError(
            'comparable-events.yaml',
            `${countryCode}/${event.id}: Invalid casualties: ${event.casualties}`,
            'error'
          );
        }

        if (!event.category) {
          addError('comparable-events.yaml', `${countryCode}/${event.id}: Missing 'category'`, 'error');
        }

        if (!event.year || event.year < 1900 || event.year > new Date().getFullYear()) {
          addError(
            'comparable-events.yaml',
            `${countryCode}/${event.id}: Invalid year: ${event.year}`,
            'warning'
          );
        }
      }

      console.log(`  ✓ Validated ${events.length} events for ${countryCode}`);
    }
  } catch (error) {
    addError('comparable-events.yaml', `Failed to load: ${error}`, 'error');
  }
}

/**
 * Extract marker references from text
 */
function extractMarkerReferences(text: string): string[] {
  const regex = /\{\{([^:}]+)(?::[^}]+)?\}\}/g;
  const matches = text.matchAll(regex);
  const refs = Array.from(matches, (m) => m[1]);
  // Filter out 'source' and 'image' as they use suffixes ({{source:key}}, {{image:key}})
  return refs.filter(ref => ref !== 'source' && ref !== 'image');
}

/**
 * Validate story markers and references
 */
async function validateStories() {
  console.log('📖 Validating story markers...');

  try {
    const storiesDir = join(process.cwd(), 'src/lib/data/stories');
    const entries = await readdir(storiesDir, { withFileTypes: true });
    const storyFolders = entries.filter((e) => e.isDirectory());

    for (const folder of storyFolders) {
      // Check for V2 story file first
      const v2StoryPath = join(storiesDir, folder.name, 'story-v2.yaml');
      const v1StoryPath = join(storiesDir, folder.name, 'story.yaml');

      let storyPath = v1StoryPath;
      try {
        await readFile(v2StoryPath, 'utf8');
        storyPath = v2StoryPath;
      } catch {
        // V2 doesn't exist, use V1
      }

      const storyContent = await readFile(storyPath, 'utf8');
      const story = load(storyContent) as Story;

      // Extract all marker references from content
      const titleRefs = extractMarkerReferences(story.title);
      const summaryRefs = extractMarkerReferences(story.summary);
      const contentRefs = extractMarkerReferences(story.content);
      const allRefs = [...new Set([...titleRefs, ...summaryRefs, ...contentRefs])];

      // Check that all references have marker definitions
      for (const ref of allRefs) {
        if (!story.markers[ref]) {
          addError(
            `${folder.name}/story.yaml`,
            `Content references undefined marker: {{${ref}}}`,
            'error'
          );
        }
      }

      // Check place marker relationships
      for (const [key, marker] of Object.entries(story.markers)) {
        if (isPlaceMarker(marker)) {
          // Check parent city references
          if (marker.within && !story.markers[marker.within]) {
            addError(
              `${folder.name}/story.yaml`,
              `Marker '${key}' references non-existent parentCity: ${marker.within}`,
              'error'
            );
          }
        }
      }

      console.log(`  ✓ Validated ${folder.name}`);
    }
  } catch (error) {
    addError('stories', `Failed to validate: ${error}`, 'error');
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔍 Running V2 context validation...\n');

  await validatePlaces();
  await validateComparableEvents();
  await validateStories();

  // Report results
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  console.log('\n' + '='.repeat(60));

  if (errors.length === 0) {
    console.log('✅ All validations passed!');
    process.exit(0);
  }

  console.log(`\n❌ Validation failed:\n`);

  // Group by file
  const byFile = errors.reduce((acc, err) => {
    if (!acc[err.file]) acc[err.file] = [];
    acc[err.file].push(err);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  for (const [file, fileErrors] of Object.entries(byFile)) {
    console.log(`\n${file}:`);
    for (const error of fileErrors) {
      const icon = error.severity === 'error' ? '  🔴' : '  ⚠️ ';
      console.log(`${icon} ${error.issue}`);
    }
  }

  console.log(`\n${errorCount} errors, ${warningCount} warnings`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
