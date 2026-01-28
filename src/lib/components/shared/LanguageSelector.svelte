<script lang="ts">
  import { selectedCountry } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { countryLanguages, languageNames } from '$lib/data/contexts';

  $: countrySpecificLanguages = countryLanguages.countries[$selectedCountry]?.languages || [];
  $: additionalLanguages = countrySpecificLanguages.filter(lang => lang !== 'en');
  $: showSelector = additionalLanguages.length > 0;
  $: currentLanguage = $selectedLanguage;

  function selectLanguage(lang: string) {
    console.log(`Language changed from ${$selectedLanguage} to ${lang}`);
    selectedLanguage.set(lang);
  }
</script>

{#if showSelector}
  <div class="flex flex-wrap gap-2 mb-6">
    <!-- Always show Original (English) -->
    <button
      on:click={() => selectLanguage('en')}
      class="language-card {currentLanguage === 'en' ? 'active' : ''}"
      type="button"
    >
      <span class="language-label">Original</span>
      <span class="language-name">English</span>
    </button>

    <!-- Additional languages for selected country -->
    {#each additionalLanguages as lang}
      <button
        on:click={() => selectLanguage(lang)}
        class="language-card {currentLanguage === lang ? 'active' : ''}"
        type="button"
      >
        <span class="language-label">{languageNames[lang] || lang}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .language-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1.25rem;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.2s;
  }

  .language-card:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(220, 38, 38, 0.3);
  }

  .language-card.active {
    background: rgba(220, 38, 38, 0.15);
    border-color: rgb(220, 38, 38);
  }

  :global(.light) .language-card {
    background: rgba(0, 0, 0, 0.03);
  }

  :global(.light) .language-card:hover {
    background: rgba(0, 0, 0, 0.08);
    border-color: rgba(220, 38, 38, 0.5);
  }

  :global(.light) .language-card.active {
    background: rgba(220, 38, 38, 0.1);
    border-color: rgb(220, 38, 38);
  }

  .language-label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .language-name {
    font-size: 0.75rem;
    opacity: 0.7;
  }
</style>
