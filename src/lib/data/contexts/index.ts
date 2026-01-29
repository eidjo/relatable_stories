import { load } from 'js-yaml';
import type { Country, NameMappings, PlaceMappings } from '$lib/types';

import countriesYaml from './countries.yaml?raw';
import namesYaml from './names.yaml?raw';
import placesYaml from './places.yaml?raw';

export const countries: Country[] = (load(countriesYaml) as { countries: Country[] }).countries;
export const names: NameMappings = load(namesYaml) as NameMappings;
export const places: PlaceMappings = load(placesYaml) as PlaceMappings;

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryNames(code: string) {
  return names[code] || names['US']; // Fallback to US if country not found
}

export function getCountryPlaces(code: string) {
  return places[code] || places['US']; // Fallback to US if country not found
}
