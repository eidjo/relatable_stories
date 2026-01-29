<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { detectCountry } from '$lib/geolocation/detector';
  import { selectedCountry } from '$lib/stores/country';
  import { countries } from '$lib/data/contexts';
  import { sortCountriesForDisplay } from '$lib/utils/sortCountries';
  import type { CountryCode } from '$lib/types';

  export let onConfirm: () => void;

  let isDetecting = true;
  let detectedCountry: CountryCode | null = null;
  let selectedOption: CountryCode | null = null;
  let showDropdown = false;
  let detectionMethod = '';

  $: sortedCountries = sortCountriesForDisplay(countries, detectedCountry);

  onMount(async () => {
    // Run IP-based detection
    console.log('Starting location detection...');
    detectedCountry = await detectCountry();
    selectedOption = detectedCountry;

    // Log detection result for debugging
    console.log(`Detected country: ${detectedCountry}`);

    isDetecting = false;
  });

  function handleConfirm() {
    if (selectedOption) {
      selectedCountry.set(selectedOption);
      // Country will be added to URL by parent component
      // No need for localStorage - URL is the source of truth
      onConfirm();
    }
  }

  function selectCountry(code: CountryCode) {
    selectedOption = code;
    showDropdown = false;
  }

  function toggleDropdown() {
    if (!isDetecting) {
      showDropdown = !showDropdown;
    }
  }

  $: currentCountry = countries.find((c) => c.code === selectedOption);
</script>

<!-- Backdrop -->
<div
  class="location-modal fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  transition:fade={{ duration: 200 }}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  on:click={(e) => e.target === e.currentTarget && !isDetecting && handleConfirm()}
  on:keydown={(e) => e.key === 'Escape' && !isDetecting && handleConfirm()}
>
  <!-- Modal -->
  <div
    class="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6"
    transition:scale={{ duration: 200, start: 0.95 }}
  >
    <!-- Header -->
    <div class="space-y-2">
      <h2 id="modal-title" class="text-2xl font-bold text-white">Welcome to Relatable Stories</h2>
      <p class="text-stone-400 text-sm leading-relaxed">
        We'll translate Iranian stories into your local context to help you connect with the human
        experiences behind the headlines.
      </p>
    </div>

    <!-- Detection Status -->
    {#if isDetecting}
      <div class="flex items-center gap-3 p-4 bg-stone-800/50 rounded border border-stone-700">
        <!-- Spinner -->
        <div class="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        <div>
          <p class="text-white font-medium">Detecting your location...</p>
          <p class="text-stone-500 text-xs">This helps us personalize the stories for you</p>
        </div>
      </div>
    {:else}
      <!-- Country Selection -->
      <div class="space-y-3">
        <label for="country-selector" class="block text-sm font-medium text-stone-300">
          Your Location
        </label>

        <div class="relative">
          <button
            id="country-selector"
            type="button"
            on:click={toggleDropdown}
            class="w-full flex items-center justify-between gap-3 px-4 py-3 bg-stone-800 border border-stone-700 rounded hover:border-stone-600 transition-colors text-left"
          >
            <div class="flex-1">
              <div class="text-white font-medium">{currentCountry?.name}</div>
              <div class="text-stone-500 text-xs">Stories will be translated for this location</div>
            </div>
            <svg
              class="w-5 h-5 text-stone-400 transition-transform {showDropdown ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showDropdown}
            <div
              class="absolute top-full left-0 right-0 mt-2 modal-dropdown border-2 rounded-lg shadow-2xl max-h-72 overflow-y-auto z-50"
              transition:scale={{ duration: 150, start: 0.95 }}
            >
              {#each sortedCountries as country}
                <button
                  type="button"
                  on:click={() => selectCountry(country.code)}
                  class="w-full px-4 py-3 text-left transition-colors border-b last:border-0 modal-dropdown-option {country.code === selectedOption ? 'modal-dropdown-option-selected font-medium' : ''}"
                >
                  {country.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if detectedCountry}
          <p class="text-xs text-stone-500">
            Detected from your timezone
            {#if selectedOption !== detectedCountry}
              <span class="text-stone-400">(changed to {currentCountry?.name})</span>
            {/if}
          </p>
        {/if}
      </div>

      <!-- Confirm Button -->
      <button
        type="button"
        on:click={handleConfirm}
        class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded transition-colors"
      >
        Continue with {currentCountry?.name}
      </button>

      <!-- Privacy Note -->
      <p class="text-xs text-stone-500 text-center">
        We detect location from your timezone (no tracking). Your choice is saved in the URL for easy sharing.
      </p>
    {/if}
  </div>
</div>

<style>
  /* Prevent body scroll when modal is open */
  :global(body:has(.location-modal)) {
    overflow: hidden;
  }
</style>
