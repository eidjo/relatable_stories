import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  // Handle country parameter from URL
  if (browser) {
    const countryParam = url.searchParams.get('country');
    if (countryParam) {
      // Update the store dynamically
      import('$lib/stores/country').then(({ selectedCountry }) => {
        selectedCountry.set(countryParam);
      });
    }
  }

  return {};
};
