<script lang="ts">
  import { base } from '$app/paths';
  import StoryCard from '$lib/components/story/StoryCard.svelte';
  import { stories } from '$lib/data/stories';
  import { translationContext } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { translateStory } from '$lib/translation/translator';
  import SocialMeta from '$lib/components/shared/SocialMeta.svelte';

  $: translatedStories = stories.map((story) => translateStory(story, $translationContext, $selectedLanguage));
</script>

<SocialMeta
  title="Stories - Relatable Stories"
  description="Read stories from Iran's uprisings, translated into your local context. Each story adapts names, places, and numbers to help you understand and empathize."
  type="website"
  image="/raha-protest-2026.jpg"
  imageAlt="Stories from Iran"
  url="/stories"
/>

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
