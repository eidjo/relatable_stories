import { getAllStories } from '$lib/data/stories';
import { countryLanguages } from '$lib/data/contexts';

export interface ShareRoute {
  slug: string;
  country: string;
  language: string;
}

/**
 * Get all available share routes based on country-languages.yaml
 * Returns combinations like: mahsa-arrest/us/en, mahsa-arrest/be/fr, etc.
 */
export function getAllShareRoutes(): ShareRoute[] {
  const routes: ShareRoute[] = [];
  const stories = getAllStories();
  const countries = countryLanguages.countries;

  // For each story, generate a route for every country × language combination
  for (const story of stories) {
    for (const [countryCode, countryData] of Object.entries(countries)) {
      for (const language of countryData.languages) {
        routes.push({
          slug: story.slug,
          country: countryCode.toLowerCase(),
          language: language.toLowerCase(),
        });
      }
    }
  }

  return routes;
}

/**
 * Generate entries for SvelteKit prerendering
 */
export function getShareRouteEntries(): string[] {
  return getAllShareRoutes().map(
    (route) => `/share/${route.slug}/${route.country}/${route.language}`
  );
}
