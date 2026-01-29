<script lang="ts">
  import { base } from '$app/paths';

  interface Props {
    title: string;
    description: string;
    type?: 'website' | 'article';
    image?: string;
    imageAlt?: string;
    url?: string;
  }

  let {
    title,
    description,
    type = 'website',
    image = '/raha-protest-2026.jpg',
    imageAlt = 'Relatable Stories from Iran',
    url = '',
  }: Props = $props();

  // Construct absolute URLs properly
  // For social meta tags, always use the production URL since sharing happens on deployed site
  const SITE_URL = 'https://eidjo.github.io';
  const BASE_PATH = '/relatable_stories';

  const absoluteUrl = $derived(url ? `${SITE_URL}${BASE_PATH}${url}` : `${SITE_URL}${BASE_PATH}/`);
  const absoluteImage = $derived(
    image.startsWith('http')
      ? image
      : `${SITE_URL}${BASE_PATH}${image.startsWith('/') ? image : '/' + image}`
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={absoluteUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={absoluteImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content={image.includes('/share/twitter/') ? '675' : '630'} />
  <meta property="og:image:alt" content={imageAlt} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={absoluteUrl} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={absoluteImage} />
  <meta name="twitter:image:alt" content={imageAlt} />
</svelte:head>
