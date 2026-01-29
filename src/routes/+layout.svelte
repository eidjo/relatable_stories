<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { selectedCountry } from '$lib/stores/country';
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';

  // Ensure URL has country parameter for non-story pages
  onMount(() => {
    if (browser) {
      const urlCountry = $page.url.searchParams.get('country');
      const isStoryDetailPage = $page.url.pathname.startsWith(`${base}/stories/`) && $page.url.pathname.split('/').length > (base ? 3 : 2);

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

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://eidjo.github.io{base}/" />
  <meta property="og:title" content="Relatable Stories - Iran Uprising Stories in Your Context" />
  <meta
    property="og:description"
    content="Real stories from Iran's 2022 fight for freedom, translated into your local context. Names, places, and numbers adapt to help you understand and empathize."
  />
  <meta property="og:image" content="https://eidjo.github.io{base}/raha-protest-2026.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Relatable Stories - Stories from Iran" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://eidjo.github.io{base}/" />
  <meta name="twitter:title" content="Relatable Stories - Iran Uprising Stories in Your Context" />
  <meta
    name="twitter:description"
    content="Real stories from Iran's 2022 fight for freedom, translated into your local context. Names, places, and numbers adapt to help you understand and empathize."
  />
  <meta name="twitter:image" content="https://eidjo.github.io{base}/raha-protest-2026.jpg" />
  <meta name="twitter:image:alt" content="Relatable Stories - Stories from Iran" />

  <!-- Additional Meta Tags -->
  <meta name="theme-color" content="#0a0a0a" />
  <meta name="author" content="Relatable Stories" />

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
