<script lang="ts">
  import StoryCard from '$lib/components/story/StoryCard.svelte';
  import { stories } from '$lib/data/stories';
  import { translationContext } from '$lib/stores/country';
  import { translateStory } from '$lib/translation/translator';

  $: translatedStories = stories.map((story) => translateStory(story, $translationContext));
</script>

<svelte:head>
  <title>Stories - Relatable Stories</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <!-- Header -->
  <div class="mb-12">
    <h1 class="text-4xl font-bold text-stone-900 mb-4">Stories from Iran</h1>
    <p class="text-lg text-stone-600 max-w-3xl">
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
      <p class="text-stone-600">No stories available yet. Check back soon.</p>
    </div>
  {/if}
</div>
