<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import StoryDetail from '$lib/components/story/StoryDetail.svelte';
  import Button from '$lib/components/shared/Button.svelte';
  import LocationConfirmationModal from '$lib/components/shared/LocationConfirmationModal.svelte';
  import { page } from '$app/stores';
  import { getStoryBySlug, getStoryBySlugTranslated } from '$lib/data/stories';
  import { translationContext, selectedCountry } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { translateStory } from '$lib/translation/translator';
  import { parsePreTranslatedWithParagraphs } from '$lib/translation/pretranslated-parser';
  import { countryLanguages } from '$lib/data/contexts';
  import type { CountryCode, Story, TranslatedStory } from '$lib/types';

  $: slug = $page.params.slug || '';

  let story: Story | undefined = undefined;
  let translatedStory: TranslatedStory | null = null;
  let isLoading = false;

  // Reload story when language or country changes
  $: if (slug && $selectedLanguage && $selectedCountry && locationConfirmed) {
    console.log('🔄 Reactive: Triggering loadStory', { slug, lang: $selectedLanguage, country: $selectedCountry });
    loadStory(slug, $selectedLanguage, $selectedCountry);
  }

  // Helper to fill {{marker}} placeholders with values from translated original
  // Only fills dates, sources, and images - leaves person/place markers alone to preserve grammar
  function fillPlaceholders(
    parsedSegments: TranslatedSegment[],
    originalSegments: TranslatedSegment[]
  ): TranslatedSegment[] {
    const result: TranslatedSegment[] = [];
    const fillableTypes = ['date', 'source', 'image'];

    for (const segment of parsedSegments) {
      if ((segment as any).isPlaceholder && segment.type && segment.key) {
        // Only fill specific types (dates, sources, images)
        // Leave person/place markers as-is to preserve grammatical inflection
        if (fillableTypes.includes(segment.type)) {
          // Find matching segment from original translation
          const match = originalSegments.find(
            (orig) => orig.type === segment.type && orig.key === segment.key
          );
          if (match) {
            result.push(match);
          } else {
            // Keep placeholder if no match found
            result.push(segment);
          }
        } else {
          // For person/place markers, keep as-is (grammar is already correct in pre-translation)
          result.push(segment);
        }
      } else {
        result.push(segment);
      }
    }

    return result;
  }

  async function loadStory(slug: string, language: string, country: CountryCode) {
    console.log('📖 loadStory called', { slug, language, country });
    isLoading = true;

    // Clear previous translation to force re-render
    translatedStory = null;
    console.log('🧹 Cleared translatedStory');

    try {
      // Load story in requested language/country
      const loadedStory = await getStoryBySlugTranslated(slug, language, country);
      console.log('📥 Loaded story:', loadedStory?.id);

      if (!loadedStory) {
        console.log('❌ No story found');
        story = undefined;
        translatedStory = null;
        isLoading = false;
        return;
      }

      story = loadedStory;

      // Check if story has [[MARKER:...]] format (pre-translated)
      const hasPreTranslatedMarkers = loadedStory.title?.includes('[[MARKER:') ||
                                      loadedStory.content?.includes('[[MARKER:');
      console.log('🔍 Has pre-translated markers:', hasPreTranslatedMarkers);

      if (hasPreTranslatedMarkers) {
        // Parse pre-translated story, but also load original to fill in remaining {{markers}}
        const originalStory = getStoryBySlug(slug);

        // Parse with both [[MARKER:...]] and {{marker}} support
        const parsedTitle = parsePreTranslatedWithParagraphs(loadedStory.title);
        const parsedSummary = parsePreTranslatedWithParagraphs(loadedStory.summary);
        const parsedContent = parsePreTranslatedWithParagraphs(loadedStory.content);

        // Fill in {{marker}} placeholders from original story using translator with target language
        const originalTranslated = originalStory ? translateStory(originalStory, $translationContext, language) : null;

        translatedStory = {
          id: loadedStory.id,
          title: fillPlaceholders(parsedTitle, originalTranslated?.title || []),
          slug: loadedStory.slug,
          date: loadedStory.date,
          summary: fillPlaceholders(parsedSummary, originalTranslated?.summary || []),
          content: fillPlaceholders(parsedContent, originalTranslated?.content || []),
          tags: loadedStory.tags,
          hashtags: loadedStory.hashtags,
          severity: loadedStory.severity,
          verified: loadedStory.verified,
          source: loadedStory.source,
          contentWarning: loadedStory['content-warning'],
          image: loadedStory.image,
          meta: loadedStory.meta,
        };
        console.log('✅ Set translatedStory (pre-translated)', {
          id: translatedStory.id,
          titleLength: translatedStory.title.length
        });
      } else {
        // Regular translation with {{markers}}
        translatedStory = translateStory(loadedStory, $translationContext, language);
        console.log('✅ Set translatedStory (runtime)', {
          id: translatedStory.id,
          titleLength: translatedStory.title.length
        });
      }
    } catch (error) {
      console.error('Failed to load story:', error);
      // Fallback to original
      story = getStoryBySlug(slug);
      translatedStory = story ? translateStory(story, $translationContext, language) : null;
      console.log('⚠️ Set translatedStory (fallback)');
    } finally {
      isLoading = false;
      console.log('🏁 loadStory completed');
    }
  }

  let initialCountrySet = false;
  let showLocationModal = false;
  let locationConfirmed = false;

  // Preserve country and language parameters in navigation links (only in browser)
  $: countryParam = browser ? $page.url.searchParams.get('country') : null;
  $: langParam = browser ? $page.url.searchParams.get('lang') : null;
  $: queryParams = [
    countryParam ? `country=${countryParam}` : null,
    langParam ? `lang=${langParam}` : null,
  ].filter(Boolean).join('&');
  $: storiesUrl = queryParams ? `/stories?${queryParams}` : '/stories';
  $: actionUrl = queryParams ? `/take-action?${queryParams}` : '/take-action';

  // Check if URL has country and language parameters
  onMount(() => {
    if (!browser) return;

    const urlCountry = $page.url.searchParams.get('country');
    const urlLang = $page.url.searchParams.get('lang');

    if (urlCountry) {
      // URL has country parameter - skip modal, use that country and language
      locationConfirmed = true;
      handleUrlSync();
    } else {
      // No country in URL - show location modal
      showLocationModal = true;
      locationConfirmed = false;
    }
  });

  async function handleLocationConfirmed() {
    showLocationModal = false;
    handleUrlSync();

    // Now set confirmed, which will trigger story loading with correct language
    locationConfirmed = true;
  }

  function handleUrlSync() {
    const urlCountry = $page.url.searchParams.get('country') as CountryCode | null;
    const urlLang = $page.url.searchParams.get('lang') as string | null;

    if (urlCountry && urlCountry !== $selectedCountry) {
      // Valid country code in URL, update store
      selectedCountry.set(urlCountry);
      initialCountrySet = true;
    } else if (!urlCountry) {
      // No country in URL, add current selection to URL
      updateUrl($selectedCountry, $selectedLanguage);
      initialCountrySet = true;
    } else {
      initialCountrySet = true;
    }

    if (urlLang && urlLang !== $selectedLanguage) {
      // Language in URL, update store
      selectedLanguage.set(urlLang);
    } else if (!urlLang) {
      // No language in URL, default to first additional language or 'en'
      const currentCountry = urlCountry || $selectedCountry;
      const countryLangs = countryLanguages.countries[currentCountry]?.languages || [];
      const additionalLangs = countryLangs.filter(lang => lang !== 'en');
      const defaultLang = additionalLangs.length > 0 ? additionalLangs[0] : 'en';
      selectedLanguage.set(defaultLang);
      updateUrl($selectedCountry, defaultLang);
    }
  }

  // Sync URL when country or language changes (browser only, after location confirmed)
  $: if (browser && initialCountrySet && locationConfirmed && $selectedCountry && $selectedLanguage) {
    updateUrl($selectedCountry, $selectedLanguage);
  }

  function updateUrl(country: CountryCode, language: string) {
    if (!browser || !$page.url) return;

    const newUrl = new URL($page.url);
    const currentCountry = newUrl.searchParams.get('country');
    const currentLang = newUrl.searchParams.get('lang');

    // Only update if different to avoid infinite loops
    if (currentCountry !== country || currentLang !== language) {
      newUrl.searchParams.set('country', country);
      newUrl.searchParams.set('lang', language);
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
          href={`/about${queryParams ? `?${queryParams}` : ''}`}
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
