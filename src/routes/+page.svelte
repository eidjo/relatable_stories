<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import StoryDetail from '$lib/components/story/StoryDetail.svelte';
  import ShareButtons from '$lib/components/shared/ShareButtons.svelte';
  import { stories } from '$lib/data/stories';
  import { translationContext } from '$lib/stores/country';
  import { translateStory } from '$lib/translation/translator';
  import { browser } from '$app/environment';

  $: slug = $page.url.searchParams.get('story');
  $: currentStory = slug ? stories.find((s) => s.slug === slug) : null;
  $: translatedStory = currentStory ? translateStory(currentStory, $translationContext) : null;
  $: shareUrl = browser ? window.location.href : '';
  $: shareTitle = translatedStory
    ? `${translatedStory.title.map((s) => s.text).join('')} - Relatable Stories from Iran`
    : 'Relatable Stories from Iran';
  $: shareText = translatedStory
    ? translatedStory.summary.map((s) => s.text).join('')
    : "Read stories from Iran's uprisings";

  onMount(() => {
    // If no story in URL, redirect to a random one
    if (!slug) {
      const randomStory = stories[Math.floor(Math.random() * stories.length)];
      goto(`?story=${randomStory.slug}`, { replaceState: true });
    }
  });

  function loadNewStory() {
    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    goto(`?story=${randomStory.slug}`);
  }
</script>

<div class="max-w-5xl mx-auto px-8 py-16 text-lg">
  {#if translatedStory}
    <!-- Share at Top (Prominent) -->
    <div
      class="mb-8 p-6 bg-gradient-to-r from-primary-600/20 to-primary-500/20 border border-primary-500/30 rounded-lg"
    >
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-primary-400 mb-1">Help Amplify Iranian Voices</h3>
          <p class="text-sm opacity-70">Share this story to raise awareness</p>
        </div>
        <ShareButtons
          url={shareUrl}
          title={shareTitle}
          text={shareText}
          storySlug={currentStory.slug}
        />
      </div>
    </div>

    <!-- Story Content -->
    <StoryDetail story={translatedStory} minimal={true} />

    <!-- Story Actions -->
    <div class="mt-16 pt-8 border-t border-white/20 space-y-4">
      <div>
        <h3 class="text-sm font-bold mb-3 opacity-70">Share this story</h3>
        <ShareButtons
          url={shareUrl}
          title={shareTitle}
          text={shareText}
          storySlug={currentStory.slug}
        />
      </div>
      <button
        on:click={loadNewStory}
        class="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded transition-colors text-sm font-medium"
      >
        Read Another Story →
      </button>
    </div>

    <!-- About Section -->
    <div class="mt-24 pt-12 border-t border-white/20 space-y-8">
      <div>
        <h2 class="text-2xl font-bold mb-4 text-primary-500">What is this?</h2>
        <p class="leading-relaxed opacity-80 mb-4">
          These are real stories from Iran's uprisings - from the 2022 protests following Mahsa
          Amini's death, to the 2026 massacre where over 36,000 were killed. Names, places, and
          numbers have been translated into your local context to help you understand and empathize
          with what happened.
        </p>
        <p class="leading-relaxed opacity-80 mb-4">
          Hover over underlined text to see the original Iranian details.
        </p>
        <a
          href="/about"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Learn More About the Context →
        </a>
      </div>

      <div>
        <h2 class="text-2xl font-bold mb-4 text-primary-500">How you can help</h2>
        <ul class="space-y-3 leading-relaxed opacity-80 mb-4">
          <li>→ Share these stories with others</li>
          <li>→ Learn more about Iran's ongoing struggle for freedom</li>
          <li>→ Support human rights organizations working on Iran</li>
          <li>→ Contact your representatives about Iranian human rights</li>
        </ul>
        <a
          href="/take-action"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          See Actions You Can Take →
        </a>
      </div>

      <div>
        <h2 class="text-2xl font-bold mb-4 text-primary-500">Sources</h2>
        <p class="leading-relaxed opacity-80 mb-3">
          Stories are based on verified testimonies from:
        </p>
        <ul class="space-y-2 text-sm opacity-70">
          <li>→ Amnesty International</li>
          <li>→ Human Rights Watch</li>
          <li>→ Iran Human Rights</li>
          <li>→ Center for Human Rights in Iran</li>
        </ul>
      </div>

      <div class="pt-8 text-sm opacity-50 border-t border-white/10">
        <p>Built with solidarity.</p>
        <p class="mt-2">For Mahsa, Nika, and all those who stood for freedom.</p>
      </div>
    </div>
  {/if}
</div>
