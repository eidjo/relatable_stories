<script lang="ts">
  import { selectedCountry } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { countryLanguages, languageNames } from '$lib/data/contexts';

  $: countrySpecificLanguages = countryLanguages.countries[$selectedCountry]?.languages || [];
  $: additionalLanguages = countrySpecificLanguages.filter((lang) => lang !== 'en');
  $: showSelector = additionalLanguages.length > 0;
  $: currentLanguage = $selectedLanguage;

  function selectLanguage(lang: string) {
    console.log(`Language changed from ${$selectedLanguage} to ${lang}`);
    selectedLanguage.set(lang);
  }
</script>

{#if showSelector}
  <div class="flex items-center gap-2">
    <span class="text-xs opacity-50 font-medium">Language:</span>
    <div class="flex flex-wrap gap-1.5">
      <!-- Always show Original (English) -->
      <button
        on:click={() => selectLanguage('en')}
        class="language-pill {currentLanguage === 'en' ? 'active' : ''}"
        type="button"
        title="Original English"
      >
        EN
      </button>

      <!-- Additional languages for selected country -->
      {#each additionalLanguages as lang}
        <button
          on:click={() => selectLanguage(lang)}
          class="language-pill {currentLanguage === lang ? 'active' : ''}"
          type="button"
          title={languageNames[lang] || lang}
        >
          {lang.toUpperCase()}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .language-pill {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;
    opacity: 0.6;
  }

  .language-pill:hover {
    opacity: 1;
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.1);
  }

  .language-pill.active {
    opacity: 1;
    background: rgba(239, 68, 68, 0.2);
    border-color: rgb(239, 68, 68);
    color: rgb(239, 68, 68);
  }

  :global(.light) .language-pill {
    border-color: rgba(0, 0, 0, 0.2);
  }

  :global(.light) .language-pill:hover {
    border-color: rgba(220, 38, 38, 0.5);
    background: rgba(220, 38, 38, 0.1);
  }

  :global(.light) .language-pill.active {
    background: rgba(220, 38, 38, 0.15);
    border-color: rgb(220, 38, 38);
    color: rgb(220, 38, 38);
  }
</style>
