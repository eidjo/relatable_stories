import yaml from 'js-yaml';
import type { GlobalActions, CountryActions } from '$lib/types';
import globalYaml from './global.yaml?raw';
import byCountryYaml from './by-country.yaml?raw';

export const globalActions: GlobalActions = yaml.load(globalYaml) as GlobalActions;
export const countryActions: CountryActions = yaml.load(byCountryYaml) as CountryActions;

export function getActionsForCountry(countryCode: string) {
  return {
    global: globalActions.actions,
    country: countryActions[countryCode] || [],
  };
}
