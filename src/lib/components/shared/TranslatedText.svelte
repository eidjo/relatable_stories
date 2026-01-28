<script lang="ts">
  import type { TranslatedSegment } from '$lib/types';
  import Tooltip from './Tooltip.svelte';
  import StoryImage from './StoryImage.svelte';

  export let segments: TranslatedSegment[];
  export let inline = false;

  let hoveredIndex: number | null = null;

  function handleMouseEnter(index: number) {
    if (segments[index].original) {
      hoveredIndex = index;
    }
  }

  function handleMouseLeave() {
    hoveredIndex = null;
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
          >{/if}{:else if segment.original}<span
          class="relative translate-hover text-primary-500 underline decoration-dotted decoration-primary-500/50 cursor-help"
          on:mouseenter={() => handleMouseEnter(i)}
          on:mouseleave={handleMouseLeave}
          on:focus={() => handleMouseEnter(i)}
          on:blur={handleMouseLeave}
          role="button"
          tabindex="0"
          aria-label="Translated text. Original: {segment.original}"
          >{segment.text}<Tooltip text={segment.original} show={hoveredIndex === i} /></span
        >{:else}{segment.text}{/if}</span
    >
  {/if}
{/each}
