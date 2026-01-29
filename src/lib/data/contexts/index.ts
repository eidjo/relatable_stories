import { load } from 'js-yaml';
import type { Country, NameMappings, PlaceMappings } from '$lib/types';
import type { PlacesDataV2, ComparableEvent } from '$lib/translation/core';

import countriesYaml from './countries.yaml?raw';
import namesYaml from './names.yaml?raw';
import placesYaml from './places.yaml?raw';
import comparableEventsYaml from './comparable-events.yaml?raw';
import countryLanguagesYaml from './country-languages.yaml?raw';

export const countries: Country[] = (load(countriesYaml) as { countries: Country[] }).countries;
export const names: NameMappings = load(namesYaml) as NameMappings;

// V2 data (now the primary data)
export const placesV2: Record<string, PlacesDataV2> = load(placesYaml) as Record<string, PlacesDataV2>;
export const comparableEvents: Record<string, ComparableEvent[]> = load(comparableEventsYaml) as Record<string, ComparableEvent[]>;

// Legacy V1 places data - kept for backwards compatibility
// Note: places.yaml now contains V2 data structure
export const places: PlaceMappings = {} as PlaceMappings;

interface CountryLanguagesData {
  countries: Record<string, { languages: string[] }>;
  language_names: Record<string, string>;
}

export const countryLanguages: CountryLanguagesData = load(countryLanguagesYaml) as CountryLanguagesData;
export const languageNames = countryLanguages.language_names;

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryNames(code: string) {
  return names[code] || names['US']; // Fallback to US if country not found
}

export function getCountryPlaces(code: string) {
  return places[code] || places['US']; // Fallback to US if country not found
}

// V2 getters
export function getCountryPlacesV2(code: string): PlacesDataV2 {
  return placesV2[code] || placesV2['US']; // Fallback to US if country not found
}

export function getCountryComparableEvents(code: string): ComparableEvent[] {
  return comparableEvents[code] || []; // Return empty array if no events for country
}
