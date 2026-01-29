import { load } from 'js-yaml';
import type { Story } from '$lib/types';

// Import story YAML files as raw strings
import mahsaArrestYaml from './mahsa-arrest/story.yaml?raw';
import raha2026Yaml from './raha-2026/story.yaml?raw';

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
