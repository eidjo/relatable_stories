/**
 * Schema-driven helpers for translation
 *
 * These functions derive marker type information from JSON schemas,
 * eliminating the need to hardcode marker types in multiple places.
 */

import storySchemaJson from '../../../schemas/story.schema.json';

// Type the schema for better IDE support
interface SchemaDefinition {
  type: string;
  required?: string[];
  properties?: Record<string, any>;
  additionalProperties?: boolean;
}

interface StorySchema {
  definitions: {
    PersonMarker: SchemaDefinition;
    PlaceMarker: SchemaDefinition;
    NumberMarker: SchemaDefinition;
    CasualtiesMarker: SchemaDefinition;
    DateMarker: SchemaDefinition;
    TimeMarker: SchemaDefinition;
    CurrencyMarker: SchemaDefinition;
    OccupationMarker: SchemaDefinition;
    TextMarker: SchemaDefinition;
    AliasMarker: SchemaDefinition;
  };
}

const storySchema = storySchemaJson as StorySchema;

/**
 * Mapping of place type properties to their data paths in CityData
 * This handles special cases like landmarks which are nested
 */
const PLACE_TYPE_DATA_PATHS: Record<string, string> = {
  'landmark-protest': 'landmarks.protest',
  'landmark-monument': 'landmarks.monument',
  'university': 'universities',
  'hospital': 'hospitals',
  'morgue': 'morgues',
  'prison': 'prisons',
  'police-station': 'police-stations',
  'government-facility': 'government-facilities'
};

/**
 * Get all place facility types from the schema
 */
export function getPlaceFacilityTypes(): Array<{ property: string; dataPath: string }> {
  const placeMarkerProps = storySchema.definitions.PlaceMarker.properties || {};

  // Filter out non-facility properties
  const excludeProps = new Set([
    'place', 'within', 'region', 'capital', 'population',
    'city-large', 'city-medium', 'city-small'
  ]);

  return Object.keys(placeMarkerProps)
    .filter(prop => !excludeProps.has(prop))
    .map(prop => ({
      property: prop,
      dataPath: PLACE_TYPE_DATA_PATHS[prop] || `${prop}s`
    }));
}

/**
 * Detect marker type from marker data using schema definitions
 */
export function detectMarkerTypeFromSchema(marker: any): string | null {
  // Check each marker type's required properties
  if (marker.person !== undefined) return 'person';
  if (marker.place !== undefined) return 'place';
  if (marker.number !== undefined) return 'number';
  if (marker.casualties !== undefined) return 'casualties';
  if (marker.date !== undefined) return 'date';
  if (marker.time !== undefined) return 'time';
  if (marker.currency !== undefined) return 'currency';
  if (marker.occupation !== undefined) return 'occupation';
  if (marker.text !== undefined) return 'text';
  if (marker.sameAs !== undefined) return 'alias';

  return null;
}

/**
 * Get nested value from object using dot notation path
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Check if a marker is a place marker
 */
export function isPlaceMarkerFromSchema(marker: any): boolean {
  return marker.place !== undefined;
}

/**
 * Check if a marker is a person marker
 */
export function isPersonMarkerFromSchema(marker: any): boolean {
  return marker.person !== undefined;
}

/**
 * Check if a marker is a number marker
 */
export function isNumberMarkerFromSchema(marker: any): boolean {
  return marker.number !== undefined && marker.casualties === undefined;
}

/**
 * Check if a marker is a casualties marker
 */
export function isCasualtiesMarkerFromSchema(marker: any): boolean {
  return marker.casualties !== undefined;
}

/**
 * Check if a marker is an alias marker
 */
export function isAliasMarkerFromSchema(marker: any): boolean {
  return marker.sameAs !== undefined;
}

/**
 * Get original value from marker (for translation display)
 */
export function getOriginalValueFromSchema(marker: any): string {
  const type = detectMarkerTypeFromSchema(marker);

  switch (type) {
    case 'person':
      return marker.person;
    case 'place':
      return marker.place;
    case 'number':
      return String(marker.number);
    case 'casualties':
      return String(marker.casualties);
    case 'date':
      return marker.date;
    case 'time':
      return marker.time;
    case 'currency':
      return `${marker.currency.toLocaleString()} Rial`;
    case 'occupation':
      return marker.occupation || '[occupation]';
    case 'text':
      return marker.text;
    case 'alias':
      return '[alias]';
    default:
      return '[original]';
  }
}

/**
 * Get all marker type definitions from schema
 */
export function getAllMarkerTypes(): string[] {
  return [
    'person',
    'place',
    'number',
    'casualties',
    'date',
    'time',
    'currency',
    'occupation',
    'text',
    'alias'
  ];
}
