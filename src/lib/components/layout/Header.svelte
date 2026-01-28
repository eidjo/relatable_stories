<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import CountrySelector from '../context/CountrySelector.svelte';
  import { theme, toggleTheme } from '$lib/stores/theme';

  // Preserve country parameter in navigation links
  $: countryParam = browser ? $page.url.searchParams.get('country') : null;
  $: storiesUrl = countryParam ? `/stories?country=${countryParam}` : '/stories';
  $: aboutUrl = countryParam ? `/about?country=${countryParam}` : '/about';
  $: actionUrl = countryParam ? `/take-action?country=${countryParam}` : '/take-action';
</script>

<header
  class="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-sm border-b border-white/10"
>
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <!-- Site title / Home link -->
    <a href={storiesUrl} class="text-lg font-bold hover:text-primary-500 transition-colors">
      Relatable Stories
    </a>

    <!-- Navigation and controls -->
    <div class="flex items-center gap-6">
      <!-- Navigation links -->
      <nav class="hidden md:flex items-center gap-6 text-sm">
        <a href={storiesUrl} class="hover:text-primary-500 transition-colors">Stories</a>
        <a href={aboutUrl} class="hover:text-primary-500 transition-colors">About</a>
        <a href={actionUrl} class="hover:text-primary-500 transition-colors">Take Action</a>
      </nav>

      <!-- Controls -->
      <div class="flex items-center gap-3">
        <!-- Theme Toggle -->
        <button
          on:click={toggleTheme}
          class="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-colors"
          aria-label="Toggle theme"
          title={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {#if $theme === 'dark'}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          {/if}
        </button>

        <!-- Country Selector -->
        <CountrySelector />
      </div>
    </div>
  </div>
</header>
