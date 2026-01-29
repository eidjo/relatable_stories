<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import StoryDetail from '$lib/components/story/StoryDetail.svelte';
  import Button from '$lib/components/shared/Button.svelte';
  import LocationConfirmationModal from '$lib/components/shared/LocationConfirmationModal.svelte';
  import { page } from '$app/stores';
  import { getStoryBySlug } from '$lib/data/stories';
  import { translationContext, selectedCountry } from '$lib/stores/country';
  import { translateStory } from '$lib/translation/translator';
  import type { CountryCode } from '$lib/types';

  $: slug = $page.params.slug || '';
  $: story = getStoryBySlug(slug);
  $: translatedStory = story ? translateStory(story, $translationContext) : null;

  let initialCountrySet = false;
  let showLocationModal = false;
  let locationConfirmed = false;

  // Preserve country parameter in navigation links (only in browser)
  $: countryParam = browser ? $page.url.searchParams.get('country') : null;
  $: storiesUrl = countryParam ? `/stories?country=${countryParam}` : '/stories';
  $: actionUrl = countryParam ? `/take-action?country=${countryParam}` : '/take-action';

  // Check if URL has country parameter
  onMount(() => {
    if (!browser) return;

    const urlCountry = $page.url.searchParams.get('country');

    if (urlCountry) {
      // URL has country parameter - skip modal, use that country
      locationConfirmed = true;
      handleUrlCountrySync();
    } else {
      // No country in URL - show location modal
      showLocationModal = true;
      locationConfirmed = false;
    }
  });

  function handleLocationConfirmed() {
    showLocationModal = false;
    locationConfirmed = true;
    handleUrlCountrySync();
  }

  function handleUrlCountrySync() {
    const urlCountry = $page.url.searchParams.get('country') as CountryCode | null;
    if (urlCountry && urlCountry !== $selectedCountry) {
      // Valid country code in URL, update store
      selectedCountry.set(urlCountry);
      initialCountrySet = true;
    } else if (!urlCountry) {
      // No country in URL, add current selection to URL
      updateUrlWithCountry($selectedCountry);
      initialCountrySet = true;
    } else {
      initialCountrySet = true;
    }
  }

  // Sync URL when country changes (browser only, after location confirmed)
  $: if (browser && initialCountrySet && locationConfirmed && $selectedCountry) {
    updateUrlWithCountry($selectedCountry);
  }

  function updateUrlWithCountry(country: CountryCode) {
    if (!browser || !$page.url) return;

    const newUrl = new URL($page.url);
    const currentCountry = newUrl.searchParams.get('country');

    // Only update if different to avoid infinite loops
    if (currentCountry !== country) {
      newUrl.searchParams.set('country', country);
      goto(newUrl.toString(), { replaceState: true, noScroll: true, keepFocus: true });
    }
  }
</script>

<svelte:head>
  {#if translatedStory}
    <title>{translatedStory.title.map(s => s.text).join('')} - Relatable Stories</title>
  {/if}
</svelte:head>

{#if showLocationModal}
  <LocationConfirmationModal onConfirm={handleLocationConfirmed} />
{/if}

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  {#if locationConfirmed && translatedStory}
    <StoryDetail story={translatedStory} />

    <!-- Context Sections -->
    <div class="mt-16 pt-12 border-t border-stone-200 space-y-8">
      <div>
        <h2 class="text-2xl font-bold mb-4 text-stone-900">What is this?</h2>
        <p class="text-stone-700 leading-relaxed mb-4">
          These are real stories from Iran's uprisings - from the 2022 protests following Mahsa
          Amini's death, to the 2026 massacre where over 36,000 were killed. Names, places, and
          numbers have been translated into your local context to help you understand and empathize
          with what happened.
        </p>
        <p class="text-stone-700 leading-relaxed mb-4">
          Hover over underlined text to see the original Iranian details.
        </p>
        <a
          href={`/about${countryParam ? `?country=${countryParam}` : ''}`}
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Learn More About the Context →
        </a>
      </div>

      <div>
        <h2 class="text-2xl font-bold mb-4 text-stone-900">How you can help</h2>
        <ul class="space-y-3 text-stone-700 leading-relaxed mb-4">
          <li>→ Share these stories with others</li>
          <li>→ Learn more about Iran's ongoing struggle for freedom</li>
          <li>→ Support human rights organizations working on Iran</li>
          <li>→ Contact your representatives about Iranian human rights</li>
        </ul>
        <a
          href={actionUrl}
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          See Actions You Can Take →
        </a>
      </div>

      <div>
        <h2 class="text-2xl font-bold mb-4 text-stone-900">Sources</h2>
        <p class="text-stone-700 leading-relaxed mb-3">
          Stories are based on verified testimonies from:
        </p>
        <ul class="space-y-2 text-sm text-stone-600">
          <li>→ Amnesty International</li>
          <li>→ Human Rights Watch</li>
          <li>→ Iran Human Rights</li>
          <li>→ Center for Human Rights in Iran</li>
        </ul>
      </div>

      <div class="pt-8 text-sm text-stone-500 border-t border-stone-200">
        <p>Built with solidarity.</p>
        <p class="mt-2">For Mahsa, Nika, and all those who stood for freedom.</p>
      </div>
    </div>

    <!-- Navigation -->
    <div class="mt-12 pt-8 border-t border-stone-200 flex justify-between">
      <Button href={storiesUrl} variant="ghost">
        ← Back to Stories
      </Button>
      <Button href={actionUrl} variant="primary">
        Take Action →
      </Button>
    </div>
  {:else if locationConfirmed}
    <div class="text-center py-12">
      <h1 class="text-3xl font-bold text-stone-900 mb-4">Story Not Found</h1>
      <p class="text-stone-600 mb-8">The story you're looking for doesn't exist.</p>
      <Button href={storiesUrl} variant="primary">View All Stories</Button>
    </div>
  {:else}
    <!-- Loading state while location modal is shown -->
    <div class="text-center py-12">
      <div class="animate-pulse space-y-4">
        <div class="h-8 bg-stone-200 rounded w-3/4 mx-auto"></div>
        <div class="h-4 bg-stone-200 rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  {/if}
</div>
