<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import StoryDetailPipeline from '$lib/components/story/StoryDetailPipeline.svelte';
  import Button from '$lib/components/shared/Button.svelte';
  import LocationConfirmationModal from '$lib/components/shared/LocationConfirmationModal.svelte';
  import { page } from '$app/stores';
  import { selectedCountry } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { contextualizationEnabled } from '$lib/stores/contextualization';
  import { translateStory, type TranslatedStoryOutput } from '$lib/translation/pipeline';
  import { theme } from '$lib/stores/theme';
  import type { CountryCode } from '$lib/types';
  import SocialMeta from '$lib/components/shared/SocialMeta.svelte';

  $: slug = $page.params.slug || '';

  let translatedStory: TranslatedStoryOutput | null = null;
  let storyKey = 0;
  let showLocationModal = false;
  let ready = false;

  // Store current values to detect changes
  let currentCountry = '';
  let currentLanguage = '';
  let currentSlug = '';
  let currentContext = false;

  // Build query params for navigation
  $: queryParams = `country=${$selectedCountry}&lang=${$selectedLanguage}`;
  $: storiesUrl = `/stories?${queryParams}`;
  $: actionUrl = `/take-action?${queryParams}`;

  // Function to translate story
  function doTranslation() {
    if (!ready || !slug) return;

    console.log('🔄 Translating story:', {
      slug,
      country: $selectedCountry,
      lang: $selectedLanguage,
    });
    try {
      translatedStory = translateStory({
        storySlug: slug,
        country: $selectedCountry,
        language: $selectedLanguage,
        contextualizationEnabled: $contextualizationEnabled,
      });
      storyKey++;

      // Update tracked values
      currentCountry = $selectedCountry;
      currentLanguage = $selectedLanguage;
      currentSlug = slug;
      currentContext = $contextualizationEnabled;

      console.log('✅ Translation complete');
    } catch (error) {
      console.error('❌ Translation failed:', error);
      translatedStory = null;
    }
  }

  // Watch for changes and re-translate
  $: if (
    ready &&
    (slug !== currentSlug ||
      $selectedCountry !== currentCountry ||
      $selectedLanguage !== currentLanguage ||
      $contextualizationEnabled !== currentContext)
  ) {
    doTranslation();
  }

  onMount(() => {
    if (!browser) return;

    // Read URL params
    const urlCountry = $page.url.searchParams.get('country') as CountryCode | null;
    const urlLang = $page.url.searchParams.get('lang');
    const urlTheme = $page.url.searchParams.get('theme');

    // Set stores from URL if present
    if (urlCountry) selectedCountry.set(urlCountry);
    if (urlLang) selectedLanguage.set(urlLang);
    if (urlTheme) theme.set(urlTheme as 'light' | 'dark');

    // Show modal only if no country in URL
    if (!urlCountry) {
      showLocationModal = true;
    } else {
      ready = true;
      // Ensure URL has all parameters
      setTimeout(() => {
        const country = urlCountry;
        const lang = urlLang || 'en';
        const themeValue = (urlTheme as 'light' | 'dark') || 'dark';
        updateUrl(country, lang, themeValue);
      }, 100);
    }

    // Subscribe to store changes and update URL (after initial load)
    let isInitialLoad = true;
    let currentCountry: CountryCode;
    let currentLang: string;
    let currentTheme: string;

    const unsubscribeCountry = selectedCountry.subscribe((value) => {
      currentCountry = value;
      if (!isInitialLoad && ready) updateUrl(currentCountry, currentLang, currentTheme);
    });
    const unsubscribeLang = selectedLanguage.subscribe((value) => {
      currentLang = value;
      if (!isInitialLoad && ready) updateUrl(currentCountry, currentLang, currentTheme);
    });
    const unsubscribeTheme = theme.subscribe((value) => {
      currentTheme = value;
      if (!isInitialLoad && ready) updateUrl(currentCountry, currentLang, currentTheme);
    });

    // Mark initial load complete
    setTimeout(() => {
      isInitialLoad = false;
    }, 100);

    // Cleanup subscriptions
    return () => {
      unsubscribeCountry();
      unsubscribeLang();
      unsubscribeTheme();
    };
  });

  function updateUrl(country: CountryCode, lang: string, themeValue: string) {
    if (!browser || !country || !lang || !themeValue) return;
    const url = new URL(window.location.href);
    url.searchParams.set('country', country);
    url.searchParams.set('lang', lang);
    url.searchParams.set('theme', themeValue);
    window.history.replaceState({}, '', url.toString());
  }

  function handleLocationConfirmed() {
    showLocationModal = false;
    ready = true;
    // Update URL with selected settings
    setTimeout(() => {
      updateUrl($selectedCountry, $selectedLanguage, $theme);
    }, 100);
  }
</script>

<!-- Meta tags for client-side rendering (social crawlers use /share/ URLs) -->
{#if translatedStory}
  {@const metaCountryCode = $selectedCountry.toLowerCase()}
  {@const metaLanguageCode = $selectedLanguage}
  {@const metaTheme = $theme}
  {@const shareImagePath = `/share/twitter/${slug}-${metaLanguageCode}-${metaCountryCode}-dark.png`}
  {@const storyTitle = translatedStory.title.map((s) => s.text).join('')}
  {@const storySummary = translatedStory.summary.map((s) => s.text).join('')}

  <SocialMeta
    title={`${storyTitle} - Relatable Stories`}
    description={storySummary}
    type="article"
    image={shareImagePath}
    imageAlt={storyTitle}
    url={`/stories/${slug}?country=${metaCountryCode}&lang=${metaLanguageCode}&theme=${metaTheme}`}
  />
{/if}

{#if showLocationModal}
  <LocationConfirmationModal onConfirm={handleLocationConfirmed} />
{/if}

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  {#if ready && translatedStory}
    {#key storyKey}
      <StoryDetailPipeline story={translatedStory} />
    {/key}

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
      <Button href={storiesUrl} variant="ghost">← Back to Stories</Button>
      <Button href={actionUrl} variant="primary">Take Action →</Button>
    </div>
  {:else if ready}
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
