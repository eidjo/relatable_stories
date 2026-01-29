import type { PageLoad, EntryGenerator } from './$types';
import { getStoryBySlug } from '$lib/data/stories';
import { getShareRouteEntries } from '$lib/utils/share-routes';
import { translateStory } from '$lib/translation/pipeline';
import { error as throwError } from '@sveltejs/kit';
import type { CountryCode } from '$lib/types';

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
  const countryCode = country.toUpperCase() as CountryCode;

  // Get base story
  const baseStory = getStoryBySlug(slug);
  if (!baseStory) {
    throw throwError(404, 'Story not found');
  }

  // Use pipeline to translate the story
  try {
    const translated = translateStory({
      storySlug: slug,
      country: countryCode,
      language: lang,
      contextualizationEnabled: true, // Always use contextualization for share images
    });

    // Extract plain text from segments
    const translatedTitle = translated.title.map((s) => s.text).join('');
    const translatedSummary = translated.summary.map((s) => s.text).join('');

    return {
      story: baseStory,
      slug,
      country: country.toLowerCase(),
      language: lang.toLowerCase(),
      translatedTitle,
      translatedSummary,
    };
  } catch (error) {
    console.error(`Failed to translate story ${slug}:`, error);
    // Fallback to untranslated
    return {
      story: baseStory,
      slug,
      country: country.toLowerCase(),
      language: lang.toLowerCase(),
      translatedTitle: baseStory.title,
      translatedSummary: baseStory.summary,
    };
  }
};
