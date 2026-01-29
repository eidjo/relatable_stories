<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { selectedCountry } from '$lib/stores/country';
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';

  // Ensure URL has country parameter for non-story pages
  onMount(() => {
    if (browser) {
      const urlCountry = $page.url.searchParams.get('country');
      const isStoryDetailPage = $page.url.pathname.startsWith('/stories/') && $page.url.pathname.split('/').length > 2;

      // Story detail pages handle their own country logic (modal on first visit)
      if (isStoryDetailPage) {
        return;
      }

      // For other pages, only add country if we have one in localStorage
      const storedCountry = localStorage.getItem('selected-country');
      if (!urlCountry && storedCountry) {
        const newUrl = new URL($page.url);
        newUrl.searchParams.set('country', storedCountry);
        goto(newUrl.toString(), { replaceState: true, noScroll: true, keepFocus: true });
      }
    }
  });
</script>

<svelte:head>
  <title>Relatable Stories - Iran Uprising Stories in Your Context</title>
  <meta
    name="description"
    content="Experience stories from Iran's 2022 uprising, translated into your local context to help you understand and empathize."
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="min-h-screen">
  <Header />
  <main class="pt-16">
    <slot />
  </main>
</div>
