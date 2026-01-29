<script lang="ts">
  import type { NormalizedSegment } from '$lib/translation/pipeline';
  import AnimatedTranslation from './AnimatedTranslation.svelte';
  import Tooltip from './Tooltip.svelte';
  import StoryImage from './StoryImage.svelte';

  export let segments: NormalizedSegment[] = [];
  export let animate: boolean = false;
  export let animationStartIndex: number = 0;

  let hoveredIndex: number | null = null;

  function handleMouseEnter(index: number) {
    hoveredIndex = index;
  }

  function handleMouseLeave() {
    hoveredIndex = null;
  }

  // Calculate animation sequence indices (non-reactive)
  function getAnimationSequenceIndex(segmentIndex: number): number {
    let count = 0;
    for (let i = 0; i < segmentIndex; i++) {
      if (segments[i].original && animate) {
        count++;
      }
    }
    return animationStartIndex + count;
  }
</script>

{#each segments as segment, i}
  {#if segment.type === 'paragraph-break'}
    <!-- Paragraph break -->
    <br />
    <br />
  {:else if segment.type === 'image'}
    <!-- Image with content warning support -->
    <StoryImage
      src={segment.metadata?.src || ''}
      alt={segment.metadata?.alt || ''}
      caption={segment.metadata?.caption}
      contentWarning={segment.metadata?.contentWarning}
      credit={segment.metadata?.credit}
      creditUrl={segment.metadata?.creditUrl}
    />
  {:else if segment.type === 'source'}
    <!-- Citation/source link -->
    <span class="relative inline-block">
      <sup>
        <a
          href={segment.metadata?.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-500 font-bold hover:text-primary-600 cursor-pointer underline"
          on:mouseenter={() => handleMouseEnter(i)}
          on:mouseleave={handleMouseLeave}
        >
          {segment.text}
        </a>
      </sup>
      {#if hoveredIndex === i && segment.tooltip}
        <Tooltip text={segment.tooltip} show={true} />
      {/if}
    </span>
  {:else if segment.type === 'comparison'}
    <!-- Comparison text (e.g., casualty counts with explanation) -->
    <span class="relative inline-block">
      <span
        class="text-primary-500 italic cursor-help"
        on:mouseenter={() => handleMouseEnter(i)}
        on:mouseleave={handleMouseLeave}
      >
        {segment.text}
      </span>
      {#if hoveredIndex === i && segment.tooltip}
        <Tooltip text={segment.tooltip} show={true} />
      {/if}
    </span>
  {:else if segment.original && animate}
    <!-- Animated translation (strikethrough → typed text) -->
    <AnimatedTranslation
      original={segment.original}
      translated={segment.text}
      explanation={segment.tooltip}
      sequenceIndex={getAnimationSequenceIndex(i)}
    />
  {:else if segment.original}
    <!-- Static translated text with tooltip -->
    <span class="relative inline-block">
      <span
        class="text-primary-500 underline decoration-dotted decoration-primary-500/50 cursor-help"
        on:mouseenter={() => handleMouseEnter(i)}
        on:mouseleave={handleMouseLeave}
      >
        {segment.text}
      </span>
      {#if hoveredIndex === i && segment.tooltip}
        <Tooltip text={segment.tooltip} show={true} />
      {/if}
    </span>
  {:else}
    <!-- Plain text -->
    <span>{segment.text}</span>
  {/if}
{/each}