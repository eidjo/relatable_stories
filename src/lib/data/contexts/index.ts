import { load } from 'js-yaml';
import type { Country, NameMappings, PlaceMappings } from '$lib/types';

import countriesYaml from './countries.yaml?raw';
import namesYaml from './names.yaml?raw';
import placesYaml from './places.yaml?raw';
import countryLanguagesYaml from './country-languages.yaml?raw';

export const countries: Country[] = (load(countriesYaml) as { countries: Country[] }).countries;
export const names: NameMappings = load(namesYaml) as NameMappings;
export const places: PlaceMappings = load(placesYaml) as PlaceMappings;

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
