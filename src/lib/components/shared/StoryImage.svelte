<script lang="ts">
  import { base } from '$app/paths';

  let isRevealed = false;

  export let src: string;
  export let alt: string;
  export let caption: string | undefined = undefined;
  export let contentWarning: string | undefined = undefined;
  export let credit: string | undefined = undefined;
  export let creditUrl: string | undefined = undefined;

  // Prepend base path to src if it starts with /
  $: fullSrc = src.startsWith('/') ? `${base}${src}` : src;

  function toggleReveal() {
    isRevealed = !isRevealed;
  }
</script>

<div class="my-12 space-y-3">
  {#if contentWarning}
    <!-- Content Warning - Toggleable -->
    <div class="relative max-w-3xl mx-auto">
      <button
        type="button"
        class="w-full block text-left cursor-pointer appearance-none border-none bg-transparent p-0"
        on:click={toggleReveal}
        aria-label={isRevealed ? 'Click to hide image' : 'Click to reveal image'}
      >
        <img
          src={fullSrc}
          {alt}
          class="w-full rounded transition-all duration-300 {isRevealed ? '' : 'blur-xl opacity-50'}"
          loading="lazy"
        />
      </button>
      {#if !isRevealed}
        <!-- Warning Overlay (shown when blurred) -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded pointer-events-none"
        >
          <div class="text-center space-y-4 px-6">
            <div class="text-primary-500 font-bold text-sm uppercase tracking-wide">
              Content Warning
            </div>
            <p class="text-white font-medium">{contentWarning}</p>
            <div class="px-6 py-2 bg-white/10 border border-white/30 rounded text-sm">
              Click to reveal image
            </div>
          </div>
        </div>
      {:else}
        <!-- Hide button (shown when revealed) -->
        <button
          on:click={toggleReveal}
          class="absolute top-2 right-2 px-3 py-1 bg-black/70 hover:bg-black/90 text-white text-xs rounded transition-colors"
          aria-label="Hide image"
        >
          Hide
        </button>
      {/if}
    </div>
  {:else}
    <!-- Normal Image (no content warning) -->
    <div class="max-w-3xl mx-auto">
      <img src={fullSrc} {alt} class="w-full rounded" loading="lazy" />
    </div>
  {/if}

  <!-- Caption and Credit -->
  {#if caption || credit}
    <div class="text-sm opacity-70 space-y-1">
      {#if caption}
        <p class="italic">{caption}</p>
      {/if}
      {#if credit}
        <p class="text-xs opacity-50">
          Photo: {#if creditUrl}<a
              href={creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary-500 underline">{credit}</a
            >{:else}{credit}{/if}
        </p>
      {/if}
    </div>
  {/if}
</div>
