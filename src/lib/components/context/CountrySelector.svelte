<script lang="ts">
  import { selectedCountry } from '$lib/stores/country';
  import { countries } from '$lib/data/contexts';

  let isOpen = false;

  function selectCountry(code: string) {
    $selectedCountry = code;
    isOpen = false;
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
        {#each countries as country}
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
