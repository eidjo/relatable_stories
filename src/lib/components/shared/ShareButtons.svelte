<script lang="ts">
  import { browser } from '$app/environment';
  import { translationContext } from '$lib/stores/country';
  import { theme } from '$lib/stores/theme';

  export let url: string;
  export let title: string;
  export let text: string = '';
  export let storySlug: string;
  export let hashtags: string = '';

  let showCopied = false;
  let supportsWebShare = false;

  // Check if Web Share API is supported
  $: if (browser) {
    supportsWebShare = 'share' in navigator;
  }

  // Get user's selected country and theme for personalized share images
  $: countryCode = $translationContext.country.toLowerCase();
  $: currentTheme = $theme;

  // Share image URLs - use locale and theme specific images
  $: twitterImageUrl = browser
    ? `${window.location.origin}/share/twitter/${storySlug}-${countryCode}-${currentTheme}.png`
    : '';
  $: instagramImageUrl = browser
    ? `${window.location.origin}/share/instagram/${storySlug}-${countryCode}-${currentTheme}.png`
    : '';

  async function handleWebShare() {
    if (supportsWebShare && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err) {
        // User cancelled or error occurred
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          fallbackCopyToClipboard();
        }
      }
    } else {
      fallbackCopyToClipboard();
    }
  }

  async function fallbackCopyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      showCopied = true;
      setTimeout(() => {
        showCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  function shareToTwitter() {
    const hashtagsPart = hashtags ? `\n\n${hashtags}` : '';
    const twitterText = encodeURIComponent(`${text}\n\n${url}${hashtagsPart}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }

  async function shareToInstagramStory() {
    // Check if Instagram app is available (mobile only)
    if (browser && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      try {
        // Try to open Instagram Stories share
        // Note: This requires the Instagram app to be installed
        const instagramUrl = `instagram-stories://share?backgroundImage=${encodeURIComponent(
          instagramImageUrl
        )}&sticker=${encodeURIComponent(instagramImageUrl)}`;

        // Attempt to redirect
        window.location.href = instagramUrl;

        // Fallback: If Instagram doesn't open, show copy message
        setTimeout(() => {
          alert(
            'To share to Instagram Stories:\n\n1. Download the share image\n2. Open Instagram\n3. Create a new Story\n4. Upload the image'
          );
        }, 1000);
      } catch (err) {
        console.error('Failed to share to Instagram:', err);
        downloadImage(instagramImageUrl, `${storySlug}-instagram.png`);
      }
    } else {
      // Desktop: Download the image for manual upload
      downloadImage(instagramImageUrl, `${storySlug}-instagram.png`);
    }
  }

  function downloadImage(imageUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="flex flex-wrap gap-3">
  <!-- Main share button (Web Share API or copy link) -->
  <button
    on:click={handleWebShare}
    class="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg transition-all text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105"
    aria-label="Share this story"
  >
    {#if showCopied}
      <span>✓ Link Copied!</span>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
      </svg>
      <span>Share</span>
    {/if}
  </button>

  <!-- Twitter share button -->
  <button
    on:click={shareToTwitter}
    class="px-6 py-3 bg-black hover:bg-gray-900 text-white rounded-lg transition-all text-sm font-bold inline-flex items-center gap-2 border border-white/20 shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 hover:scale-105"
    aria-label="Share on Twitter"
    title="Share on Twitter"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
    <span>Twitter</span>
  </button>

  <!-- Instagram share button -->
  <button
    on:click={shareToInstagramStory}
    class="px-6 py-3 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:from-yellow-600 hover:via-pink-600 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 border-2 border-transparent light:border-purple-600/20"
    aria-label="Share to Instagram Story"
    title="Share to Instagram Story"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
    <span>Instagram</span>
  </button>
</div>
