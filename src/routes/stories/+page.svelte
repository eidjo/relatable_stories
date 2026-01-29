<script lang="ts">
  import { base } from '$app/paths';
  import StoryCard from '$lib/components/story/StoryCard.svelte';
  import { stories } from '$lib/data/stories';
  import { translationContext } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { translateStory } from '$lib/translation/translator';

  $: translatedStories = stories.map((story) => translateStory(story, $translationContext, $selectedLanguage));

  const pageUrl = `https://eidjo.github.io${base}/stories`;
  const pageTitle = 'Stories - Relatable Stories';
  const pageDescription = 'Read stories from Iran\'s uprisings, translated into your local context. Each story adapts names, places, and numbers to help you understand and empathize.';
  const pageImage = `https://eidjo.github.io${base}/raha-protest-2026.jpg`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:image" content={pageImage} />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={pageUrl} />
  <meta property="twitter:title" content={pageTitle} />
  <meta property="twitter:description" content={pageDescription} />
  <meta property="twitter:image" content={pageImage} />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <!-- Header -->
  <div class="mb-12">
    <h1 class="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">Stories from Iran</h1>
    <p class="text-lg text-stone-600 dark:text-stone-300 max-w-3xl">
      Each story is translated into your local context. Hover over any underlined text to see the
      original Iranian details.
    </p>
  </div>

  <!-- Stories Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each translatedStories as story}
      <StoryCard {story} />
    {/each}
  </div>

  {#if stories.length === 0}
    <div class="text-center py-12">
      <p class="text-stone-600 dark:text-stone-400">No stories available yet. Check back soon.</p>
    </div>
  {/if}
</div>
