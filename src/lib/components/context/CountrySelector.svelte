<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { selectedCountry } from '$lib/stores/country';
  import { countries } from '$lib/data/contexts';
  import { sortCountriesForDisplay } from '$lib/utils/sortCountries';
  import type { CountryCode } from '$lib/types';

  let isOpen = false;

  // Sort countries with currently selected at top, then Iran, then alphabetical
  $: sortedCountries = sortCountriesForDisplay(countries, $selectedCountry);

  function selectCountry(code: string) {
    $selectedCountry = code;
    isOpen = false;

    // Update URL with new country parameter
    updateUrlWithCountry(code);
  }

  function updateUrlWithCountry(country: CountryCode) {
    if (!browser || !$page.url) return;

    const newUrl = new URL($page.url);
    newUrl.searchParams.set('country', country);

    goto(newUrl.toString(), {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function handleWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (target && !target.closest('.country-selector-wrapper')) {
      isOpen = false;
    }
  }

  $: currentCountry = countries.find((c) => c.code === $selectedCountry);
</script>

<div class="relative country-selector-wrapper">
  <button
    on:click={toggleDropdown}
    class="country-selector-button flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors min-w-[140px]"
    aria-haspopup="true"
    aria-expanded={isOpen}
  >
    <span class="flex-1 text-left">{currentCountry?.name}</span>
    <svg
      class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div
      class="country-dropdown absolute right-0 z-10 w-64 mt-2 rounded shadow-xl max-h-96 overflow-y-auto"
    >
      <div class="py-1" role="menu">
        {#each sortedCountries as country}
          <button
            on:click={() => selectCountry(country.code)}
            class="country-option block w-full px-4 py-2 text-left text-sm {country.code ===
            $selectedCountry
              ? 'country-option-selected'
              : ''}"
            role="menuitem"
          >
            {country.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<svelte:window on:click={handleWindowClick} />
