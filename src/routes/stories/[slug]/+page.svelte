<script lang="ts">
  import StoryDetail from '$lib/components/story/StoryDetail.svelte';
  import Button from '$lib/components/shared/Button.svelte';
  import { page } from '$app/stores';
  import { getStoryBySlug } from '$lib/data/stories';
  import { translationContext } from '$lib/stores/country';
  import { translateStory } from '$lib/translation/translator';

  $: slug = $page.params.slug || '';
  $: story = getStoryBySlug(slug);
  $: translatedStory = story ? translateStory(story, $translationContext) : null;
</script>

<svelte:head>
  {#if translatedStory}
    <title>{translatedStory.title.map(s => s.text).join('')} - Relatable Stories</title>
  {/if}
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  {#if translatedStory}
    <StoryDetail story={translatedStory} />

    <!-- Navigation -->
    <div class="mt-12 pt-8 border-t border-stone-200 flex justify-between">
      <Button href="/stories" variant="ghost">
        ← Back to Stories
      </Button>
      <Button href="/take-action" variant="primary">
        Take Action →
      </Button>
    </div>
  {:else}
    <div class="text-center py-12">
      <h1 class="text-3xl font-bold text-stone-900 mb-4">Story Not Found</h1>
      <p class="text-stone-600 mb-8">The story you're looking for doesn't exist.</p>
      <Button href="/stories" variant="primary">View All Stories</Button>
    </div>
  {/if}
</div>
