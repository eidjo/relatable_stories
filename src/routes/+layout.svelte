<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { selectedCountry } from '$lib/stores/country';
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
  import SocialMeta from '$lib/components/shared/SocialMeta.svelte';

  // Ensure URL has country parameter for non-story pages
  onMount(() => {
    if (browser) {
      const urlCountry = $page.url.searchParams.get('country');
      const isStoryDetailPage = $page.url.pathname.startsWith(`${base}/stories/`) && $page.url.pathname.split('/').length > (base ? 3 : 2);
      const isSharePage = $page.url.pathname.startsWith(`${base}/share/`);

      // Story detail pages handle their own country logic (modal on first visit)
      // Share pages redirect immediately, don't interfere
      if (isStoryDetailPage || isSharePage) {
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

<SocialMeta
  title="Relatable Stories - Iran Uprising Stories in Your Context"
  description="Real stories from Iran's 2022 fight for freedom, translated into your local context. Names, places, and numbers adapt to help you understand and empathize."
  type="website"
  image="/raha-protest-2026.jpg"
  imageAlt="Relatable Stories - Stories from Iran"
/>

<svelte:head>
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
