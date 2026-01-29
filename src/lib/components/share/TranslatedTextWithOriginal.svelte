<svelte:options css="injected" />

<script lang="ts">
  import type { TranslatedSegment } from '$lib/types';

  let { segments, inline = false }: { segments: TranslatedSegment[]; inline?: boolean } = $props();
</script>

{#each segments as segment, i}
  {#if segment.type === 'source'}
    {#if segment.url}
      <sup class="text-[#ef4444] font-bold">{segment.text}</sup>
    {:else}
      <sup class="text-[#ef4444] font-bold">{segment.text}</sup>
    {/if}
  {:else if segment.original}
    <span class="text-[#ef4444]">
      <span class="line-through opacity-50">{segment.original}</span>
      <span class="ml-1">{segment.text}</span>
    </span>
  {:else}
    <span>{segment.text}</span>
  {/if}
{/each}
