import type { PageLoad, EntryGenerator } from './$types';
import { getStoryBySlug, getStoryBySlugTranslated } from '$lib/data/stories';
import { getShareRouteEntries } from '$lib/utils/share-routes';
import { translateStory } from '$lib/translation/translator';
import { parsePreTranslatedWithParagraphs } from '$lib/translation/pretranslated-parser';
import { getCountryByCode, getCountryNames, getCountryPlaces } from '$lib/data/contexts';
import { error as throwError } from '@sveltejs/kit';
import type { CountryCode, TranslationContext, TranslatedSegment } from '$lib/types';

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

// Helper to fill {{marker}} placeholders with values from translated original
function fillPlaceholders(
  parsedSegments: TranslatedSegment[],
  originalSegments: TranslatedSegment[]
): TranslatedSegment[] {
  const result: TranslatedSegment[] = [];
  const fillableTypes = ['date', 'source', 'image'];

  for (const segment of parsedSegments) {
    if ((segment as any).isPlaceholder && segment.type && segment.key) {
      if (fillableTypes.includes(segment.type)) {
        const match = originalSegments.find(
          (orig) => orig.type === segment.type && orig.key === segment.key
        );
        if (match) {
          result.push(match);
        } else {
          result.push(segment);
        }
      } else {
        result.push(segment);
      }
    } else {
      result.push(segment);
    }
  }

  return result;
}

export const load: PageLoad = async ({ params }) => {
  const { slug, country, lang } = params;
  const countryCode = country.toUpperCase() as CountryCode;

  // Get base story
  const baseStory = getStoryBySlug(slug);
  if (!baseStory) {
    throw throwError(404, 'Story not found');
  }

  // Get country data for translation context
  const countryData = getCountryByCode(countryCode);
  if (!countryData) {
    return {
      story: baseStory,
      slug,
      country: country.toLowerCase(),
      language: lang.toLowerCase(),
      translatedTitle: baseStory.meta?.['og-title'] || baseStory.title,
      translatedSummary: baseStory.meta?.['og-description'] || baseStory.summary,
    };
  }

  const translationContext: TranslationContext = {
    country: countryCode,
    countryData,
    names: getCountryNames(countryCode),
    places: getCountryPlaces(countryCode),
  };

  // Try to load pre-translated version (for non-English languages)
  let translatedTitle: string;
  let translatedSummary: string;

  if (lang !== 'en') {
    try {
      const preTranslatedStory = await getStoryBySlugTranslated(slug, lang, countryCode);

      if (preTranslatedStory && (preTranslatedStory.title?.includes('[[MARKER:') || preTranslatedStory.content?.includes('[[MARKER:'))) {
        // Has pre-translated markers - parse them
        const parsedTitle = parsePreTranslatedWithParagraphs(preTranslatedStory.title);
        const parsedSummary = parsePreTranslatedWithParagraphs(preTranslatedStory.summary);

        // Fill in remaining {{markers}} from runtime translation
        const runtimeTranslated = translateStory(baseStory, translationContext, lang);
        const filledTitle = fillPlaceholders(parsedTitle, runtimeTranslated.title);
        const filledSummary = fillPlaceholders(parsedSummary, runtimeTranslated.summary);

        translatedTitle = filledTitle.map((s) => s.text).join('');
        translatedSummary = filledSummary.map((s) => s.text).join('');
      } else {
        // No pre-translation, use runtime translation
        const runtimeTranslated = translateStory(baseStory, translationContext, lang);
        translatedTitle = runtimeTranslated.title.map((s) => s.text).join('');
        translatedSummary = runtimeTranslated.summary.map((s) => s.text).join('');
      }
    } catch (error) {
      // Pre-translation not found, fall back to runtime translation
      const runtimeTranslated = translateStory(baseStory, translationContext, lang);
      translatedTitle = runtimeTranslated.title.map((s) => s.text).join('');
      translatedSummary = runtimeTranslated.summary.map((s) => s.text).join('');
    }
  } else {
    // English: use runtime translation (with country-specific names)
    const runtimeTranslated = translateStory(baseStory, translationContext, lang);
    translatedTitle = runtimeTranslated.title.map((s) => s.text).join('');
    translatedSummary = runtimeTranslated.summary.map((s) => s.text).join('');
  }

  return {
    story: baseStory,
    slug,
    country: country.toLowerCase(),
    language: lang.toLowerCase(),
    translatedTitle,
    translatedSummary,
  };
};
