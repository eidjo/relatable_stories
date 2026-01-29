import { load } from 'js-yaml';
import type { Story } from '$lib/types';
import type { LanguageCode } from '$lib/stores/language';
import type { CountryCode } from '$lib/types';

// Import story YAML files as raw strings
import mahsaArrestYaml from './mahsa-arrest/story.yaml?raw';
import raha2026Yaml from './raha-2026/story.yaml?raw';

// Import translated versions (dynamically imported later)
const storyModules = import.meta.glob('./*/story.*.yaml', { query: '?raw', import: 'default' });

// Parse stories
const storyFiles = [mahsaArrestYaml, raha2026Yaml];

export const stories: Story[] = storyFiles.map((yaml) => load(yaml) as Story);

export function getStoryBySlug(slug: string): Story | undefined {
  return stories.find((story) => story.slug === slug);
}

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id);
}

export function getAllStories(): Story[] {
  return stories;
}

/**
 * Get a story in a specific language for a specific country
 * Falls back to original story if translation not found
 */
export async function getStoryBySlugTranslated(
  slug: string,
  language: LanguageCode,
  country: CountryCode
): Promise<Story | undefined> {
  // For English (original), always return the original story
  // It will be translated at runtime with the selected country context
  if (language === 'en') {
    return getStoryBySlug(slug);
  }

  // Try to load pre-translated version for other languages
  const translatedPath = `./${slug}/story.${language}-${country.toLowerCase()}.yaml`;

  console.log(`Attempting to load: ${translatedPath}`);
  console.log(`Available paths:`, Object.keys(storyModules));

  try {
    const loader = storyModules[translatedPath];
    if (loader) {
      console.log(`Found loader for ${translatedPath}`);
      const yaml = await loader() as string;
      const story = load(yaml) as Story;
      return story;
    } else {
      console.warn(`No loader found for ${translatedPath}`);
    }
  } catch (error) {
    console.warn(`Translation not found: ${translatedPath}, falling back to original`, error);
  }

  // Fallback to original
  return getStoryBySlug(slug);
}
