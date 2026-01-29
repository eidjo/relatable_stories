<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import type { PageData } from './$types';
  import SocialMeta from '$lib/components/shared/SocialMeta.svelte';

  export let data: PageData;

  // Construct share image path (always use dark theme for social media)
  const shareImagePath = `/share/twitter/${data.slug}-${data.language}-${data.country}-dark.png`;

  // Use translated title and summary (with country-specific context and names)
  // Falls back to generic meta tags if translation failed
  const socialTitle =
    data.translatedTitle ||
    data.story.meta?.['og-title'] ||
    'A Story from Iran - Relatable Stories';
  const socialDescription =
    data.translatedSummary ||
    data.story.meta?.['og-description'] ||
    "Real stories from Iran's uprisings, translated into your local context to help you understand and empathize.";

  // Redirect immediately in browser (before layout logic runs)
  if (browser) {
    // Construct the target URL with base path
    // Country code needs to be uppercase for the story page
    const targetPath = `${base}/stories/${data.slug}?country=${data.country.toUpperCase()}&lang=${data.language}`;
    // Use window.location for immediate redirect, bypassing SvelteKit navigation
    window.location.href = targetPath;
  }
</script>

<!-- Meta tags for social media crawlers -->
<SocialMeta
  title={socialTitle}
  description={socialDescription}
  type="article"
  image={shareImagePath}
  imageAlt={socialTitle}
  url={`/share/${data.slug}/${data.country}/${data.language}`}
/>

<!-- Minimal content while redirecting -->
<div class="min-h-screen flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-2xl font-bold mb-4">{socialTitle}</h1>
    <p class="text-gray-600 mb-6">Redirecting...</p>
    <a
      href={`${base}/stories/${data.slug}?country=${data.country.toUpperCase()}&lang=${data.language}`}
      class="text-primary-600 hover:text-primary-700 underline"
    >
      Click here if you're not redirected automatically
    </a>
  </div>
</div>
