import { json, error } from '@sveltejs/kit';
import { translateStory } from '$lib/translation/pipeline';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
  const { slug } = params;
  const country = url.searchParams.get('country') || 'US';
  const language = url.searchParams.get('lang') || 'en';
  const contextualizationEnabled = url.searchParams.get('contextualization') !== 'false';

  try {
    const result = await translateStory({
      storySlug: slug,
      country: country,
      language: language,
      contextualizationEnabled,
    });

    return json(result);
  } catch (err) {
    console.error('Translation error:', err);
    throw error(500, `Failed to translate story: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};
