/**
 * Schema validation script
 *
 * Validates YAML files against JSON schemas to ensure consistency
 * across the codebase. This catches errors early:
 * - Missing required fields
 * - Unsupported marker types
 * - Invalid facility types in places.yaml
 * - YAML syntax errors
 *
 * Usage:
 *   npm run validate:schemas
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'fs/promises';
import { glob } from 'glob';
import yaml from 'js-yaml';

const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false // Allow additional keywords
});
addFormats(ajv);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Load and compile a JSON schema
 */
async function loadSchema(schemaPath) {
  const content = await readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(content);
  return ajv.compile(schema);
}

/**
 * Validate a YAML file against a schema
 */
async function validateFile(filePath, validate, schemaName) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = yaml.load(content);

    const valid = validate(data);

    if (!valid) {
      console.log(`${colors.red}✗${colors.reset} ${filePath}`);
      console.log(`  ${colors.gray}Schema: ${schemaName}${colors.reset}`);

      for (const error of validate.errors) {
        const instancePath = error.instancePath || '/';
        const message = error.message;
        const params = error.params ? ` (${JSON.stringify(error.params)})` : '';

        console.log(`  ${colors.yellow}→${colors.reset} ${instancePath}: ${message}${colors.gray}${params}${colors.reset}`);

        // Show the problematic data if available
        if (error.data !== undefined) {
          const dataPreview = JSON.stringify(error.data).substring(0, 100);
          console.log(`    ${colors.gray}Data: ${dataPreview}${colors.reset}`);
        }
      }

      return false;
    } else {
      console.log(`${colors.green}✓${colors.reset} ${filePath}`);
      return true;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${filePath}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Get the plural form and data path for a place type
 */
function getPlaceTypeInfo(placeType) {
  // Special cases for landmarks (nested structure)
  if (placeType === 'landmark-protest') {
    return {
      markerCheck: `marker\\['landmark-protest'\\]`,
      dataCheck: `cityData\\.landmarks\\?\\.protest`
    };
  }
  if (placeType === 'landmark-monument') {
    return {
      markerCheck: `marker\\['landmark-monument'\\]`,
      dataCheck: `cityData\\.landmarks\\?\\.monument`
    };
  }

  // Regular pluralization rules
  const pluralMap = {
    'university': 'universities',
    'government-facility': 'government-facilities',
    'hospital': 'hospitals',
    'morgue': 'morgues',
    'prison': 'prisons',
    'police-station': 'police-stations'
  };

  const plural = pluralMap[placeType] || `${placeType}s`;

  // Handle both dot notation and bracket notation
  const markerCheck = placeType.includes('-')
    ? `marker\\['${placeType}'\\]`
    : `marker\\.${placeType}`;

  const dataCheck = plural.includes('-')
    ? `cityData\\['${plural}'\\]`
    : `cityData\\.${plural}`;

  return { markerCheck, dataCheck };
}

/**
 * Check that translation script handles all place marker types
 */
async function checkTranslationScriptCompleteness() {
  console.log(`\n${colors.blue}Checking translation script completeness...${colors.reset}`);

  // Load translation script
  const translateScriptContent = await readFile('scripts/translate-stories.js', 'utf-8');

  // Check if using schema-driven approach
  const usesSchemaHelpers = /getPlaceFacilityTypes/.test(translateScriptContent);

  if (usesSchemaHelpers) {
    console.log(`${colors.green}✓${colors.reset} Translation script uses schema-driven approach (getPlaceFacilityTypes)`);
    return true;
  }

  // Fallback: check for individual handlers (legacy approach)
  const storySchemaContent = await readFile('schemas/story.schema.json', 'utf-8');
  const storySchema = JSON.parse(storySchemaContent);
  const placeMarkerDef = storySchema.definitions.PlaceMarker;

  const placeTypes = Object.keys(placeMarkerDef.properties).filter(key =>
    key !== 'place' &&
    key !== 'within' &&
    key !== 'region' &&
    key !== 'capital' &&
    key !== 'population' &&
    !key.startsWith('city-')
  );

  const missingHandlers = [];
  for (const placeType of placeTypes) {
    const { markerCheck, dataCheck } = getPlaceTypeInfo(placeType);
    const markerPattern = new RegExp(markerCheck);
    const dataPattern = new RegExp(dataCheck);

    if (!markerPattern.test(translateScriptContent) || !dataPattern.test(translateScriptContent)) {
      missingHandlers.push(placeType);
    }
  }

  if (missingHandlers.length > 0) {
    console.log(`${colors.red}✗${colors.reset} Translation script missing handlers for:`);
    for (const type of missingHandlers) {
      console.log(`  ${colors.yellow}→${colors.reset} ${type}`);
    }
    console.log(`  ${colors.gray}Update scripts/translate-stories.js to handle these types${colors.reset}`);
    console.log(`  ${colors.gray}Or use schema-driven approach with getPlaceFacilityTypes()${colors.reset}`);
    return false;
  } else {
    console.log(`${colors.green}✓${colors.reset} All place marker types are handled in translation script`);
    return true;
  }
}

/**
 * Check that core.ts handles all place marker types
 */
async function checkCoreTranslationCompleteness() {
  console.log(`\n${colors.blue}Checking core.ts translation completeness...${colors.reset}`);

  // Load core.ts
  const coreContent = await readFile('src/lib/translation/core.ts', 'utf-8');

  // Check if using schema-driven approach
  const usesSchemaHelpers = /getPlaceFacilityTypes/.test(coreContent);

  if (usesSchemaHelpers) {
    console.log(`${colors.green}✓${colors.reset} core.ts uses schema-driven approach (getPlaceFacilityTypes)`);
    return true;
  }

  // Fallback: check for individual handlers (legacy approach)
  const storySchemaContent = await readFile('schemas/story.schema.json', 'utf-8');
  const storySchema = JSON.parse(storySchemaContent);
  const placeMarkerDef = storySchema.definitions.PlaceMarker;

  const placeTypes = Object.keys(placeMarkerDef.properties).filter(key =>
    key !== 'place' &&
    key !== 'within' &&
    key !== 'region' &&
    key !== 'capital' &&
    key !== 'population' &&
    !key.startsWith('city-')
  );

  const missingHandlers = [];
  for (const placeType of placeTypes) {
    const { markerCheck, dataCheck } = getPlaceTypeInfo(placeType);
    const markerPattern = new RegExp(markerCheck);
    const dataPattern = new RegExp(dataCheck);

    if (!markerPattern.test(coreContent) || !dataPattern.test(coreContent)) {
      missingHandlers.push(placeType);
    }
  }

  if (missingHandlers.length > 0) {
    console.log(`${colors.red}✗${colors.reset} core.ts missing handlers for:`);
    for (const type of missingHandlers) {
      console.log(`  ${colors.yellow}→${colors.reset} ${type}`);
    }
    console.log(`  ${colors.gray}Update src/lib/translation/core.ts to handle these types${colors.reset}`);
    console.log(`  ${colors.gray}Or use schema-driven approach with getPlaceFacilityTypes()${colors.reset}`);
    return false;
  } else {
    console.log(`${colors.green}✓${colors.reset} All place marker types are handled in core.ts`);
    return true;
  }
}

async function main() {
  console.log(`${colors.blue}🔍 Validating YAML files against schemas${colors.reset}\n`);

  let totalFiles = 0;
  let validFiles = 0;
  let failedFiles = 0;

  // Validate story files
  console.log(`${colors.blue}Stories:${colors.reset}`);
  const storySchema = await loadSchema('schemas/story.schema.json');
  const storyFiles = await glob('src/lib/data/stories/*/story.yaml');

  for (const file of storyFiles) {
    totalFiles++;
    const valid = await validateFile(file, storySchema, 'story.schema.json');
    if (valid) validFiles++;
    else failedFiles++;
  }

  // Validate places.yaml
  console.log(`\n${colors.blue}Places:${colors.reset}`);
  const placesSchema = await loadSchema('schemas/places.schema.json');
  totalFiles++;
  const placesValid = await validateFile('src/lib/data/contexts/places.yaml', placesSchema, 'places.schema.json');
  if (placesValid) validFiles++;
  else failedFiles++;

  // Validate countries.yaml
  console.log(`\n${colors.blue}Countries:${colors.reset}`);
  const countriesSchema = await loadSchema('schemas/countries.schema.json');
  totalFiles++;
  const countriesValid = await validateFile('src/lib/data/contexts/countries.yaml', countriesSchema, 'countries.schema.json');
  if (countriesValid) validFiles++;
  else failedFiles++;

  // Validate names.yaml
  console.log(`\n${colors.blue}Names:${colors.reset}`);
  const namesSchema = await loadSchema('schemas/names.schema.json');
  totalFiles++;
  const namesValid = await validateFile('src/lib/data/contexts/names.yaml', namesSchema, 'names.schema.json');
  if (namesValid) validFiles++;
  else failedFiles++;

  // Check translation script completeness
  const translationScriptComplete = await checkTranslationScriptCompleteness();
  if (!translationScriptComplete) failedFiles++;

  // Check core.ts completeness
  const coreComplete = await checkCoreTranslationCompleteness();
  if (!coreComplete) failedFiles++;

  // Summary
  console.log(`\n${'━'.repeat(50)}`);
  if (failedFiles === 0) {
    console.log(`${colors.green}✓ All validations passed!${colors.reset}`);
    console.log(`  Files validated: ${totalFiles}`);
  } else {
    console.log(`${colors.red}✗ Validation failed${colors.reset}`);
    console.log(`  ${colors.green}Valid:${colors.reset} ${validFiles}`);
    console.log(`  ${colors.red}Failed:${colors.reset} ${failedFiles}`);
    console.log(`  Total: ${totalFiles}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
