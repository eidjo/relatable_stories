<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import CallToAction from '$lib/components/action/CallToAction.svelte';
  import { getActionsForCountry } from '$lib/data/actions';
  import { translationContext } from '$lib/stores/country';
  import { countries } from '$lib/data/contexts';

  $: actions = getActionsForCountry($translationContext.country);
  $: currentCountry = countries.find((c) => c.code === $translationContext.country);

  // Preserve country parameter in links
  $: countryParam = browser ? $page.url.searchParams.get('country') : null;
  $: aboutUrl = countryParam ? `${base}/about?country=${countryParam}` : `${base}/about`;
  $: storiesUrl = countryParam ? `${base}/stories?country=${countryParam}` : `${base}/stories`;

  const pageUrl = `https://eidjo.github.io${base}/take-action`;
  const pageTitle = 'Take Action - Relatable Stories from Iran';
  const pageDescription = 'Learn how you can help support Iranian protesters and human rights. Contact representatives, share stories, and support organizations.';
  const pageImage = `https://eidjo.github.io${base}/raha-protest-2026.jpg`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={pageUrl} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:image" content={pageImage} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={pageUrl} />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={pageImage} />
  <meta name="twitter:image:alt" content="Take Action for Iran" />
</svelte:head>

<div class="max-w-5xl mx-auto px-8 py-16">
  <!-- Page header -->
  <div class="space-y-4 mb-12">
    <h1 class="text-4xl font-bold">Take Action</h1>
    <p class="text-lg opacity-80 leading-relaxed max-w-3xl">
      The Iranian people are fighting for basic freedoms at great personal risk. Here are concrete
      ways you can help amplify their voices and support their struggle.
    </p>
  </div>

  <!-- Call to action sections -->
  <CallToAction
    globalActions={actions.global}
    countryActions={actions.country}
    countryName={currentCountry?.name}
  />

  <!-- Additional context -->
  <div class="mt-16 pt-12 border-t border-white/20 space-y-6">
    <h2 class="text-2xl font-bold text-primary-500">Why Your Action Matters</h2>
    <div class="space-y-4 text-base opacity-80 leading-relaxed">
      <p>
        International attention and pressure can make a real difference for Iranians fighting for
        their rights. When you contact your representatives, share stories, or support human rights
        organizations, you:
      </p>
      <ul class="list-disc list-inside space-y-2 pl-4">
        <li>Help break the regime's information blockade</li>
        <li>Put pressure on governments to impose targeted sanctions</li>
        <li>Support families of victims and detained protesters</li>
        <li>Preserve evidence of human rights abuses for future accountability</li>
        <li>Show Iranians they are not alone in their struggle</li>
      </ul>
      <p>
        Every action, no matter how small it seems, contributes to a larger movement for justice and
        accountability. The Iranian regime has shown it is sensitive to international pressure -
        your voice matters.
      </p>
    </div>
  </div>

  <!-- More ways to help -->
  <div class="mt-12 pt-8 border-t border-white/20">
    <h3 class="text-xl font-bold mb-4">More Ways to Help</h3>
    <div class="space-y-3 text-sm opacity-80">
      <p>
        → <strong>Educate yourself:</strong> Visit the
        <a href={aboutUrl} class="text-primary-500 hover:text-primary-600 underline">about page</a>
        to learn more about Iran's uprisings and timeline of events
      </p>
      <p>
        → <strong>Share stories:</strong> Use the share buttons on individual stories to help them reach
        a wider audience
      </p>
      <p>
        → <strong>Follow Iranian voices:</strong> Follow Iranian activists, journalists, and human rights
        organizations on social media
      </p>
      <p>
        → <strong>Remember the names:</strong> Visit memorial sites and databases that document those
        killed, detained, or disappeared
      </p>
    </div>
  </div>
</div>
