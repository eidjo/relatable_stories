<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { translationContext } from '$lib/stores/country';
  import Tooltip from './Tooltip.svelte';

  export let original: string;
  export let translated: string;
  export let sequenceIndex: number = 0; // Index in the sequence of animations

  let displayedText = '';
  let animationStarted = false;
  let animationComplete = false;
  let showOriginal = true;
  let elementRef: HTMLElement;
  let observer: IntersectionObserver | null = null;
  let currentCountry = '';
  let showTooltip = false;

  const TYPING_SPEED = 80; // ms per character
  const PAUSE_BEFORE_REPLACE = 600; // ms to pause on strikethrough before replacing
  const DELAY_BETWEEN_ANIMATIONS = 200; // ms delay between sequential animations

  // Calculate total delay based on sequence index
  $: sequenceDelay = sequenceIndex * DELAY_BETWEEN_ANIMATIONS;

  // Watch for country changes to re-trigger animation
  $: if ($translationContext?.country && $translationContext.country !== currentCountry) {
    currentCountry = $translationContext.country;
    resetAnimation();
  }

  function resetAnimation() {
    animationStarted = false;
    animationComplete = false;
    showOriginal = true;
    displayedText = '';

    // Re-setup observer if element is still in view
    if (elementRef && observer) {
      observer.disconnect();
      setupObserver();
    }
  }

  function setupObserver() {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animationStarted) {
            // Add sequence delay before starting
            setTimeout(() => {
              if (entry.isIntersecting && !animationStarted) {
                animationStarted = true;
                startAnimation();
              }
            }, sequenceDelay);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '100px', // Start slightly before fully visible
      }
    );

    if (elementRef) {
      observer.observe(elementRef);
    }
  }

  onMount(() => {
    currentCountry = $translationContext?.country || '';
    setupObserver();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  });

  async function startAnimation() {
    // Wait a moment with strikethrough visible
    await sleep(PAUSE_BEFORE_REPLACE);

    // Hide original, start typing translated
    showOriginal = false;

    // Type out the translated text character by character
    for (let i = 0; i <= translated.length; i++) {
      displayedText = translated.substring(0, i);
      await sleep(TYPING_SPEED);
    }

    animationComplete = true;
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function handleMouseEnter() {
    if (animationComplete) {
      showTooltip = true;
    }
  }

  function handleMouseLeave() {
    showTooltip = false;
  }
</script>

<span class="relative inline-block" bind:this={elementRef}>
  {#if showOriginal}
    <span
      class="text-muted opacity-50 line-through decoration-2"
      in:fade={{ duration: 200 }}
    >
      {original}
    </span>
  {:else}
    <span
      class="text-primary-500 font-medium underline decoration-dotted decoration-primary-500/50 cursor-help"
      in:fade={{ duration: 150 }}
      on:mouseenter={handleMouseEnter}
      on:mouseleave={handleMouseLeave}
      on:focus={handleMouseEnter}
      on:blur={handleMouseLeave}
      role="button"
      tabindex="0"
      aria-label="Translated text. Original: {original}"
    >
      {displayedText}<span class="animate-pulse"
        >{#if !animationComplete}|{/if}</span
      >
      <Tooltip text={original} show={showTooltip} />
    </span>
  {/if}
</span>

<style>
  .text-muted {
    color: var(--text-muted, rgba(255, 255, 255, 0.5));
  }
</style>
