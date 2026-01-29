<script lang="ts">
  import { browser } from '$app/environment';
  import TranslatedText from '../shared/TranslatedText.svelte';
  import ShareButtons from '../shared/ShareButtons.svelte';
  import type { TranslatedStory, TranslatedSegment } from '$lib/types';

  export let story: TranslatedStory;
  export let minimal = false;

  // Get current URL and prepare share data
  $: currentUrl = browser ? window.location.href : '';
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
    <h1 class="text-4xl font-bold leading-tight">
      <TranslatedText segments={story.title} inline animate animationStartIndex={0} />
    </h1>

    <!-- Metadata -->
    {#if !minimal}
      <div class="flex flex-wrap items-center gap-4 text-sm opacity-70">
        <span>{story.date}</span>
        <span class={severityColors[story.severity]}>
          [{story.severity}]
        </span>
        {#if story.verified}
          <span class="text-primary-400"> [verified] </span>
        {/if}
      </div>
    {/if}

    {#if story.contentWarning}
      <div class="border-l-4 border-primary-600 pl-4 py-2 bg-primary-900/20">
        <p class="text-sm text-primary-400">
          <strong>Content Warning:</strong>
          {story.contentWarning}
        </p>
      </div>
    {/if}

    <!-- Share Buttons - Top -->
    {#if !minimal}
      <div class="pt-6 pb-4 border-t border-white/10 light:border-black/10">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <p class="text-sm opacity-70 font-medium">Share this story to amplify Iranian voices:</p>
          <ShareButtons
            url={currentUrl}
            title={shareTitle}
            text={shareText}
            storySlug={story.slug}
            hashtags={story.hashtags || ''}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Summary -->
  <div class="text-xl leading-relaxed opacity-90">
    <TranslatedText segments={story.summary} inline animate animationStartIndex={summaryStartIndex} />
  </div>

  <!-- Content -->
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
          url={currentUrl}
          title={shareTitle}
          text={shareText}
          storySlug={story.slug}
          hashtags={story.hashtags || ''}
        />
      </div>
    </div>
  {/if}
</article>
