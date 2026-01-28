<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { detectCountry } from '$lib/geolocation/detector';
  import { selectedCountry } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { countries, countryLanguages, languageNames } from '$lib/data/contexts';
  import { sortCountriesForDisplay } from '$lib/utils/sortCountries';
  import type { CountryCode } from '$lib/types';
  import type { LanguageCode } from '$lib/stores/language';

  export let onConfirm: () => void;

  let isDetecting = true;
  let detectedCountry: CountryCode | null = null;
  let selectedOption: CountryCode | null = null;
  let selectedLang: LanguageCode = 'en';
  let showDropdown = false;
  let detectionMethod = '';

  $: sortedCountries = sortCountriesForDisplay(countries, detectedCountry);
  $: countrySpecificLanguages = selectedOption
    ? (countryLanguages.countries[selectedOption]?.languages || [])
    : [];
  $: additionalLanguages = countrySpecificLanguages.filter(lang => lang !== 'en');
  $: showLanguageSelector = additionalLanguages.length > 0;

  // Default to first additional language, or 'en' if none available
  $: defaultLanguage = additionalLanguages.length > 0 ? additionalLanguages[0] : 'en';

  onMount(async () => {
    // Run IP-based detection
    console.log('Starting location detection...');
    detectedCountry = await detectCountry();
    selectedOption = detectedCountry;

    // Set default language for detected country
    const countryLangs = countryLanguages.countries[detectedCountry]?.languages || [];
    const additionalLangs = countryLangs.filter(lang => lang !== 'en');
    selectedLang = additionalLangs.length > 0 ? additionalLangs[0] : 'en';

    // Log detection result for debugging
    console.log(`Detected country: ${detectedCountry}, default language: ${selectedLang}`);

    isDetecting = false;
  });

  function handleConfirm() {
    if (selectedOption) {
      selectedCountry.set(selectedOption);
      selectedLanguage.set(selectedLang);
      // Country and language will be added to URL by parent component
      // No need for localStorage - URL is the source of truth
      onConfirm();
    }
  }

  function selectCountry(code: CountryCode) {
    selectedOption = code;
    showDropdown = false;

    // Set default language for new country
    const newCountryLanguages = countryLanguages.countries[code]?.languages || [];
    const newAdditionalLangs = newCountryLanguages.filter(lang => lang !== 'en');

    // If current language not available in new country, reset to default
    if (selectedLang !== 'en' && !newCountryLanguages.includes(selectedLang)) {
      selectedLang = newAdditionalLangs.length > 0 ? newAdditionalLangs[0] : 'en';
    }
  }

  function toggleDropdown() {
    if (!isDetecting) {
      showDropdown = !showDropdown;
    }
  }

  function selectLanguage(lang: LanguageCode) {
    selectedLang = lang;
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
    <div class="space-y-4">
      <h2 id="modal-title" class="text-2xl font-bold text-white">Stories from Iran</h2>

      <!-- Visual Example of Substitution -->
      <div class="bg-gradient-to-br from-stone-800/80 to-stone-800/40 border-2 border-stone-700/80 rounded-lg p-5 space-y-3">
        <p class="text-stone-300 text-xs font-medium uppercase tracking-wide">How it works</p>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-stone-500 line-through text-base">Mahsa in Tehran</span>
            <svg class="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span class="text-primary-400 font-semibold text-base">
              {#if selectedOption === 'US'}Emily in New York
              {:else if selectedOption === 'UK'}Olivia in London
              {:else if selectedOption === 'FR'}Emma in Paris
              {:else if selectedOption === 'DE'}Emma in Berlin
              {:else if selectedOption === 'ES'}Lucía in Madrid
              {:else if selectedOption === 'IT'}Sofia in Rome
              {:else if selectedOption === 'NL'}Emma in Amsterdam
              {:else if selectedOption === 'SE'}Alice in Stockholm
              {:else if selectedOption === 'BE'}Emma in Brussels
              {:else if selectedOption === 'CZ'}Anna in Prague
              {:else if selectedOption === 'CA'}Emma in Toronto
              {:else if selectedOption === 'AU'}Charlotte in Sydney
              {:else if selectedOption === 'BR'}Alice in São Paulo
              {:else if selectedOption === 'GR'}Maria in Athens
              {:else if selectedOption === 'PT'}Maria in Lisbon
              {:else if selectedOption === 'NO'}Emma in Oslo
              {:else if selectedOption === 'DK'}Emma in Copenhagen
              {:else if selectedOption === 'FI'}Aino in Helsinki
              {:else if selectedOption === 'PL'}Julia in Warsaw
              {:else}Emma in your city
              {/if}
            </span>
          </div>
          <p class="text-stone-400 text-xs italic">Names, places, and numbers adapt to your context</p>
        </div>
      </div>
    </div>

    <!-- Detection Status -->
    {#if isDetecting}
      <div class="flex items-center gap-3 p-4 bg-stone-800/50 rounded border border-stone-700">
        <!-- Spinner -->
        <div class="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        <p class="text-white font-medium">Detecting location...</p>
      </div>
    {:else}
      <!-- Country Selection -->
      <div class="space-y-2">
        <label for="country-selector" class="block text-sm font-medium text-stone-300">
          Translate for
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

      </div>

      <!-- Language Selection (only show if additional languages available) -->
      {#if showLanguageSelector}
        <div class="space-y-2">
          <label for="language-selector" class="block text-sm font-medium text-stone-300">
            Language
          </label>

          <div class="flex flex-wrap gap-2">
            <!-- Always show Original (English) -->
            <button
              type="button"
              on:click={() => selectLanguage('en')}
              class="px-4 py-2 rounded border transition-colors {selectedLang === 'en'
                ? 'bg-primary-600 border-primary-500 text-white'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'}"
            >
              <div class="text-sm font-medium">Original</div>
              <div class="text-xs opacity-75">English</div>
            </button>

            <!-- Additional languages for this country -->
            {#each additionalLanguages as lang}
              <button
                type="button"
                on:click={() => selectLanguage(lang)}
                class="px-4 py-2 rounded border transition-colors {selectedLang === lang
                  ? 'bg-primary-600 border-primary-500 text-white'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:border-stone-600'}"
              >
                <div class="text-sm font-medium">
                  {languageNames[lang] || lang}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Confirm Button -->
      <button
        type="button"
        on:click={handleConfirm}
        class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded transition-colors"
      >
        Continue
      </button>

      <!-- Privacy Note -->
      <p class="text-xs text-stone-500 text-center">
        No tracking • Settings saved in URL
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
