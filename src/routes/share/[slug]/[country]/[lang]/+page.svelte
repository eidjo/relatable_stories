<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import type { PageData } from './$types';
  import SocialMeta from '$lib/components/shared/SocialMeta.svelte';

  export let data: PageData;

  // Construct share image path
  const shareImagePath = `/share/twitter/${data.slug}-${data.language}-${data.country}-dark.png`;

  // Redirect immediately in browser (before layout logic runs)
  if (browser) {
    // Construct the target URL with base path
    const targetPath = `${base}/stories/${data.slug}?country=${data.country}&lang=${data.language}`;
    // Use window.location for immediate redirect, bypassing SvelteKit navigation
    window.location.href = targetPath;
  }
</script>

<!-- Meta tags for social media crawlers -->
<SocialMeta
  title={`${data.story.title} - Relatable Stories`}
  description={data.story.summary}
  type="article"
  image={shareImagePath}
  imageAlt={data.story.title}
  url={`/share/${data.slug}/${data.country}/${data.language}`}
/>

<!-- Minimal content while redirecting -->
<div class="min-h-screen flex items-center justify-center">
  <div class="text-center">
    <h1 class="text-2xl font-bold mb-4">{data.story.title}</h1>
    <p class="text-gray-600 mb-6">Redirecting...</p>
    <a
      href={`${base}/stories/${data.slug}?country=${data.country}&lang=${data.language}`}
      class="text-primary-600 hover:text-primary-700 underline"
    >
      Click here if you're not redirected automatically
    </a>
  </div>
</div>
