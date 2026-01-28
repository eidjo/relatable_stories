<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import Card from '../shared/Card.svelte';
  import TranslatedText from '../shared/TranslatedText.svelte';
  import type { TranslatedStory } from '$lib/types';

  export let story: TranslatedStory;

  const severityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  // Preserve country parameter in link (only in browser)
  $: countryParam = browser ? $page.url.searchParams.get('country') : null;
  $: storyUrl = countryParam ? `/stories/${story.slug}?country=${countryParam}` : `/stories/${story.slug}`;
</script>

<a href={storyUrl} class="block">
  <Card hover padding="md">
    <div class="flex flex-col gap-3">
      <!-- Title -->
      <h3 class="text-xl font-bold card-title">
        <TranslatedText segments={story.title} inline />
      </h3>

      <!-- Severity Badge -->
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {severityColors[story.severity]}">
          {story.severity}
        </span>
        {#if story.verified}
          <span class="inline-flex items-center text-xs text-primary-600 dark:text-primary-400">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Verified
          </span>
        {/if}
      </div>

      <!-- Summary -->
      <p class="text-sm card-text">
        <TranslatedText segments={story.summary} inline />
      </p>

      <!-- Date -->
      <p class="text-xs card-text-muted">{story.date}</p>
    </div>
  </Card>
</a>
