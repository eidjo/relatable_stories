/**
 * V2 Marker Type System
 *
 * Improvements over V1:
 * - Simpler syntax (gender: m/f/x instead of boolean flags)
 * - Hierarchical relationships (within, sameAs)
 * - Dedicated casualties type with auto-comparison
 * - Type detection from properties, not explicit 'type' field
 */

export type Gender = 'm' | 'f' | 'x'; // male, female, neutral

/**
 * Person Marker - Represents a person with name translation
 */
export interface PersonMarker {
  person: string; // Original Iranian name
  gender: Gender; // Gender for name selection
  age?: number; // Age of person
  from?: string; // Key to place marker - use regional names
}

/**
 * Place Marker - Represents a location with hierarchical support
 */
export interface PlaceMarker {
  place: string; // Original Iranian place name
  'city-small'?: boolean; // City size (only one should be true)
  'city-medium'?: boolean;
  'city-large'?: boolean;
  capital?: boolean; // Is this a capital city?
  landmark?: boolean; // General landmark
  'landmark-protest'?: boolean; // Protest location
  'landmark-monument'?: boolean; // Monument/memorial
  university?: boolean;
  hospital?: boolean;
  morgue?: boolean;
  'government-facility'?: boolean;
  within?: string; // Parent place marker key (e.g., city contains landmark)
  region?: string; // Geographic region
  population?: number; // City population (for better scaling)
}

/**
 * Number Marker - Generic numeric values
 */
export interface NumberMarker {
  number: number; // Base value
  cities?: boolean; // Unit type (only one should be true)
  days?: boolean;
  years?: boolean;
  months?: boolean;
  hours?: boolean;
  scaled?: boolean; // Auto-scale by population ratio
  scaleFactor?: number; // Optional dampening (default: 1.0 = pure ratio)
  variance?: number; // Add random variance (±N)
}

/**
 * Casualties Marker - Human casualties with automatic comparison
 *
 * Key difference from NumberMarker:
 * - Always scales by population (no opt-in)
 * - Always tries to find comparable local disaster
 * - Special rendering (emphasis, comparison text)
 * - Different validation rules
 */
export interface CasualtiesMarker {
  casualties: number; // Number of people
  killed?: boolean; // Type of casualty (only one should be true)
  wounded?: boolean;
  missing?: boolean;
  detained?: boolean;
  executed?: boolean;
  scope?: 'country' | 'city'; // What population to scale against (default: 'country')
  scopeCity?: string; // If scope='city', key to the city marker with population
  comparable?: 'massacre' | 'terrorist-attack' | 'natural-disaster' | 'war-casualties' | 'any';
  comparedTo?: string; // Key to another casualties marker for comparison
  timeframe?: string; // Optional context (e.g., 'over two days', 'in one night')
}

/**
 * Date Marker - Temporal dates
 */
export interface DateMarker {
  date: string; // ISO format or descriptive text
  format?: string; // Optional format override
}

/**
 * Time Marker - Time of day
 */
export interface TimeMarker {
  time: string; // ISO time or descriptive text
  format?: string; // Optional format override
}

/**
 * Alias Marker - Reuses another marker's translation
 */
export interface AliasMarker {
  sameAs: string; // Key of marker to alias
}

/**
 * Source Marker - Citation reference
 * Keeps explicit type for backward compatibility
 */
export interface SourceMarker {
  type: 'source';
  text: string; // Citation number/text
  url?: string; // Link to source
  title?: string; // Title for tooltip
  number?: number; // Reference number
}

/**
 * Image Marker - Embedded image
 * Keeps explicit type for backward compatibility
 */
export interface ImageMarker {
  type: 'image';
  src: string; // Image path
  alt: string; // Alt text
  caption?: string; // Optional caption
  contentWarning?: string;
  credit?: string;
  creditUrl?: string;
}

/**
 * Paragraph Break Marker - Content structure
 * Keeps explicit type for backward compatibility
 */
export interface ParagraphBreakMarker {
  type: 'paragraph-break';
}

/**
 * Union type of all markers
 */
export type Marker =
  | PersonMarker
  | PlaceMarker
  | NumberMarker
  | CasualtiesMarker
  | DateMarker
  | TimeMarker
  | AliasMarker
  | SourceMarker
  | ImageMarker
  | ParagraphBreakMarker;

/**
 * Runtime type detection for V2 markers
 * Detects type from marker properties instead of explicit 'type' field
 */
export function getMarkerType(marker: Marker): string {
  if ('person' in marker) return 'person';
  if ('place' in marker) return 'place';
  if ('number' in marker) return 'number';
  if ('casualties' in marker) return 'casualties';
  if ('date' in marker) return 'date';
  if ('time' in marker) return 'time';
  if ('text' in marker) return 'text';
  if ('occupation' in marker) return 'occupation';
  if ('currency' in marker) return 'currency';
  if ('sameAs' in marker) return 'alias';
  if ('type' in marker) return marker.type; // source, image, paragraph-break
  return 'unknown';
}

/**
 * Type guards for specific marker types
 */
export function isPersonMarker(marker: Marker): marker is PersonMarker {
  return 'person' in marker;
}

export function isPlaceMarker(marker: Marker): marker is PlaceMarker {
  return 'place' in marker;
}

export function isNumberMarker(marker: Marker): marker is NumberMarker {
  return 'number' in marker;
}

export function isCasualtiesMarker(marker: Marker): marker is CasualtiesMarker {
  return 'casualties' in marker;
}

export function isAliasMarker(marker: Marker): marker is AliasMarker {
  return 'sameAs' in marker;
}

export function isSourceMarker(marker: Marker): marker is SourceMarker {
  return 'type' in marker && marker.type === 'source';
}

export function isImageMarker(marker: Marker): marker is ImageMarker {
  return 'type' in marker && marker.type === 'image';
}
