<script lang="ts">
  import type { TranslatedSegment } from '$lib/types';
  import Tooltip from './Tooltip.svelte';
  import StoryImage from './StoryImage.svelte';
  import AnimatedTranslation from './AnimatedTranslation.svelte';
  import { contextualizationEnabled } from '$lib/stores/contextualization';

  export let segments: TranslatedSegment[];
  export let inline = false;
  export let animate = false; // Enable character-by-character animation on scroll
  export let animationStartIndex = 0; // Starting index for animation sequencing

  let hoveredIndex: number | null = null;

  // Calculate animation sequence index for each segment with an original
  function getAnimationSequenceIndex(segments: TranslatedSegment[], index: number): number {
    let sequenceIndex = animationStartIndex;
    for (let i = 0; i < index; i++) {
      if (segments[i].original) {
        sequenceIndex++;
      }
    }
    return sequenceIndex;
  }

  function handleMouseEnter(index: number) {
    // Show tooltip for segments with original text OR explanation (e.g., comparisons)
    if (segments[index].original || segments[index].explanation) {
      hoveredIndex = index;
    }
  }

  function handleMouseLeave() {
    hoveredIndex = null;
  }

  function getTooltipText(segment: TranslatedSegment, contextualizationEnabled: boolean): string {
    // If explanation exists, show it (for scaled numbers and casualties)
    if (segment.explanation) {
      return segment.explanation;
    }
    // Otherwise show original/translated as before
    if (contextualizationEnabled) {
      return segment.original || segment.text;
    }
    return segment.text;
  }
</script>

{#each segments as segment, i}
  {#if segment.type === 'image' && segment.src}
    <StoryImage
      src={segment.src}
      alt={segment.alt || ''}
      caption={segment.caption}
      contentWarning={segment.contentWarning}
      credit={segment.credit}
      creditUrl={segment.creditUrl}
    />
  {:else if segment.type === 'comparison'}
    <!-- Casualty comparison (from {{killed:comparable}}) - red with tooltip -->
    <span
      class="relative text-primary-500 italic cursor-help"
      on:mouseenter={() => handleMouseEnter(i)}
      on:mouseleave={handleMouseLeave}
      on:focus={() => handleMouseEnter(i)}
      on:blur={handleMouseLeave}
      role="button"
      tabindex="0"
      aria-label="Casualty comparison. {segment.explanation || ''}"
    >
      {segment.text}
      {#if segment.explanation}
        <Tooltip text={segment.explanation} show={hoveredIndex === i} />
      {/if}
    </span>
  {:else}
    <span class:inline class:block={!inline}
      >{#if segment.type === 'source'}{#if segment.url}<span
            class="relative inline-block align-baseline"
            ><a
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              on:mouseenter={() => handleMouseEnter(i)}
              on:mouseleave={handleMouseLeave}
              on:focus={() => handleMouseEnter(i)}
              on:blur={handleMouseLeave}
              aria-label={segment.title || 'Source citation'}
              ><sup
                class="text-primary-500 font-bold hover:text-primary-600 cursor-pointer underline"
                >{segment.text}</sup
              ></a
            >{#if segment.title}<Tooltip
                text={segment.title}
                show={hoveredIndex === i}
              />{/if}</span
          >{:else}<sup class="text-primary-500 font-bold">{segment.text}</sup
          >{/if}{:else if segment.original}{#if !$contextualizationEnabled}<!-- Contextualization disabled: show original with local context in tooltip --><span
            class="relative translate-hover text-primary-500 underline decoration-dotted decoration-primary-500/50 cursor-help"
            on:mouseenter={() => handleMouseEnter(i)}
            on:mouseleave={handleMouseLeave}
            on:focus={() => handleMouseEnter(i)}
            on:blur={handleMouseLeave}
            role="button"
            tabindex="0"
            aria-label="Original text. Local equivalent: {segment.text}"
            >{segment.original}<Tooltip
                text={getTooltipText(segment, false)}
                show={hoveredIndex === i}
              /></span
          >{:else if animate}<AnimatedTranslation
            original={segment.original}
            translated={segment.text}
            sequenceIndex={getAnimationSequenceIndex(segments, i)}
            explanation={segment.explanation}
          />{:else}<span
            class="relative translate-hover text-primary-500 underline decoration-dotted decoration-primary-500/50 cursor-help"
            on:mouseenter={() => handleMouseEnter(i)}
            on:mouseleave={handleMouseLeave}
            on:focus={() => handleMouseEnter(i)}
            on:blur={handleMouseLeave}
            role="button"
            tabindex="0"
            aria-label="Translated text. Original: {segment.original}"
            >{segment.text}<Tooltip
                text={getTooltipText(segment, true)}
                show={hoveredIndex === i}
              /></span
          >{/if}{:else}{segment.text}{/if}</span
    >
  {/if}
{/each}
