import type { PageLoad, EntryGenerator } from './$types';
import { getStoryBySlug } from '$lib/data/stories';
import { getShareRouteEntries } from '$lib/utils/share-routes';
import { error } from '@sveltejs/kit';

export const prerender = true;

// Generate all possible share URLs
export const entries: EntryGenerator = () => {
  const routes = getShareRouteEntries();
  return routes.map((route) => {
    const parts = route.split('/').filter(Boolean); // ['share', 'slug', 'country', 'lang']
    return {
      slug: parts[1],
      country: parts[2],
      lang: parts[3],
    };
  });
};

export const load: PageLoad = async ({ params }) => {
  const { slug, country, lang } = params;
  const story = getStoryBySlug(slug);

  if (!story) {
    throw error(404, 'Story not found');
  }

  return {
    story,
    slug,
    country: country.toLowerCase(),
    language: lang.toLowerCase(),
  };
};
