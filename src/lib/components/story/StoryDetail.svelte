<script lang="ts">
  import { browser } from '$app/environment';
  import TranslatedText from '../shared/TranslatedText.svelte';
  import ShareButtons from '../shared/ShareButtons.svelte';
  import LanguageSelector from '../shared/LanguageSelector.svelte';
  import ContextualizationToggle from '../shared/ContextualizationToggle.svelte';
  import ErrorBoundary from '../shared/ErrorBoundary.svelte';
  import { selectedCountry } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { contextualizationEnabled } from '$lib/stores/contextualization';
  import { countryLanguages, countries } from '$lib/data/contexts';
  import { formatDate } from '$lib/utils/dateLocales';
  import type { TranslatedStory, TranslatedSegment } from '$lib/types';

  export let story: TranslatedStory;
  export let minimal = false;

  $: countrySpecificLanguages = countryLanguages.countries[$selectedCountry]?.languages || [];
  $: additionalLanguages = countrySpecificLanguages.filter(lang => lang !== 'en');
  $: showLanguageSelector = additionalLanguages.length > 0;
  $: currentCountryName = countries.find(c => c.code === $selectedCountry)?.name || $selectedCountry;

  // Format date based on selected language
  $: formattedDate = formatDate(story.date, 'PPP', $selectedLanguage);

  // Prepare share data
  $: shareTitle = story.title.map(s => s.text).join('');
  $: shareText = `${shareTitle} - A story from Iran's uprising, translated into your local context.`;

  const severityColors = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  // Split content into paragraphs based on paragraph-break segments
  function splitIntoParagraphs(segments: TranslatedSegment[]): TranslatedSegment[][] {
    const paragraphs: TranslatedSegment[][] = [];
    let currentParagraph: TranslatedSegment[] = [];

    segments.forEach((segment) => {
      if (segment.type === ('paragraph-break' as any)) {
        // End current paragraph
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph);
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(segment);
      }
    });

    // Add final paragraph
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs;
  }

  // Extract all sources from content
  function extractSources(
    segments: TranslatedSegment[]
  ): Array<{ number: string; title: string; url: string }> {
    const sources: Array<{ number: string; title: string; url: string }> = [];
    const seen = new Set<string>();

    segments.forEach((segment) => {
      if (segment.type === 'source' && segment.url && segment.title && !seen.has(segment.text)) {
        sources.push({
          number: segment.text,
          title: segment.title,
          url: segment.url,
        });
        seen.add(segment.text);
      }
    });

    return sources.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  }

  $: contentParagraphs = splitIntoParagraphs(story.content);
  $: sources = extractSources(story.content);

  // Calculate cumulative animation indices for sequencing
  function countOriginals(segments: TranslatedSegment[]): number {
    return segments.filter(s => s.original).length;
  }

  $: titleOriginalsCount = countOriginals(story.title);
  $: summaryOriginalsCount = countOriginals(story.summary);
  $: summaryStartIndex = titleOriginalsCount;
  $: contentStartIndex = titleOriginalsCount + summaryOriginalsCount;

  // Calculate start index for each content paragraph
  function getContentParagraphStartIndex(paragraphIndex: number): number {
    let count = contentStartIndex;
    for (let i = 0; i < paragraphIndex; i++) {
      count += countOriginals(contentParagraphs[i]);
    }
    return count;
  }
</script>

<article class="space-y-8">
  <!-- Header -->
  <div class="space-y-4">
    <ErrorBoundary>
      <h1 class="text-4xl font-bold leading-tight">
        <TranslatedText segments={story.title} inline animate animationStartIndex={0} />
      </h1>
    </ErrorBoundary>

    <!-- Metadata & Controls -->
    {#if !minimal}
      <div class="space-y-4">
        <!-- Metadata line -->
        <div class="flex flex-wrap items-center gap-3 text-sm opacity-70">
          <span>{formattedDate}</span>
          <span class="opacity-40">•</span>
          <span class={severityColors[story.severity]}>
            {story.severity}
          </span>
          {#if story.verified}
            <span class="opacity-40">•</span>
            <span class="text-primary-400">verified</span>
          {/if}
          {#if story.contentWarning}
            <span class="opacity-40">•</span>
            <span class="text-primary-400 text-xs px-2 py-0.5 bg-primary-500/10 border border-primary-500/30 rounded">
              CW: {story.contentWarning}
            </span>
          {/if}
        </div>

        <!-- Control Bar -->
        <div class="bg-white/5 light:bg-black/5 border border-white/10 light:border-black/10 rounded-lg p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <!-- Left: Language -->
            <div class="flex flex-wrap items-center gap-4">
              {#if showLanguageSelector}
                <div class="flex items-center gap-2">
                  <LanguageSelector />
                </div>
              {/if}
            </div>

            <!-- Right: Share -->
            <div class="flex items-center gap-3">
              <ShareButtons
                title={shareTitle}
                text={shareText}
                storySlug={story.slug}
                hashtags={story.hashtags || ''}
              />
            </div>
          </div>
        </div>

        <!-- Context Toggle - Prominent Center Section -->
        <div class="flex flex-col items-center gap-4 py-6 px-4 bg-gradient-to-b from-primary-500/5 to-transparent border-y border-primary-500/20">
          <ContextualizationToggle />

          <p class="text-sm text-center max-w-2xl leading-relaxed">
            {#if $contextualizationEnabled}
              Names, places, and values adapted to {currentCountryName} context.
              <span class="text-primary-500 font-semibold">Hover over red text</span> to see the original Iranian context.
            {:else}
              Reading with original Iranian context.
              <span class="text-primary-500 font-semibold">Hover over red text</span> to see {currentCountryName} equivalents.
            {/if}
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Summary -->
  <ErrorBoundary>
    <div class="text-xl leading-relaxed opacity-90">
      <TranslatedText segments={story.summary} inline animate animationStartIndex={summaryStartIndex} />
    </div>
  </ErrorBoundary>

  <!-- Content -->
  <ErrorBoundary>
    <div class="leading-relaxed opacity-80 space-y-6">
      {#each contentParagraphs as paragraph, pIdx}
        <p>
          <TranslatedText
            segments={paragraph}
            inline
            animate
            animationStartIndex={getContentParagraphStartIndex(pIdx)}
          />
        </p>
      {/each}
    </div>
  </ErrorBoundary>

  <!-- Sources List -->
  {#if sources.length > 0}
    <div class="pt-6 border-t border-white/10 light:border-black/10">
      <h3 class="text-lg font-bold mb-3">Sources</h3>
      <ol class="space-y-2 text-sm opacity-70">
        {#each sources as source}
          <li class="flex gap-2">
            <span class="text-primary-500 font-bold">[{source.number}]</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary-500 underline"
            >
              {source.title}
            </a>
          </li>
        {/each}
      </ol>
    </div>
  {/if}

  <!-- Source -->
  {#if story.source && !minimal}
    <div class="pt-6 border-t border-white/10 light:border-black/10">
      <p class="text-sm opacity-50">
        <strong>Attribution:</strong>
        {story.source}
      </p>
    </div>
  {/if}

  <!-- Share Buttons - Bottom -->
  {#if !minimal}
    <div class="pt-8 border-t border-white/10 light:border-black/10">
      <div class="bg-primary-900/20 light:bg-primary-100/50 rounded-lg p-6">
        <h3 class="text-lg font-bold mb-3">Help Amplify This Story</h3>
        <p class="text-sm opacity-70 mb-4">
          Share this story to help others understand the human cost of repression in Iran.
          Your share image is personalized to your location to create maximum empathy and impact.
        </p>
        <ShareButtons
          title={shareTitle}
          text={shareText}
          storySlug={story.slug}
          hashtags={story.hashtags || ''}
        />
      </div>
    </div>
  {/if}
</article>
