<script lang="ts">
  import { browser } from '$app/environment';
  import { base } from '$app/paths';
  import { translationContext } from '$lib/stores/country';
  import { selectedLanguage } from '$lib/stores/language';
  import { theme } from '$lib/stores/theme';

  export let url: string;
  export let title: string;
  export let text: string = '';
  export let storySlug: string;
  export let hashtags: string = '';

  let showCopied = false;
  let supportsWebShare = false;
  let showInstagramInstructions = false;

  // Check if Web Share API is supported
  $: if (browser) {
    supportsWebShare = 'share' in navigator;
  }

  // Get user's selected country, language, and theme for personalized share images
  $: countryCode = $translationContext.country.toLowerCase();
  $: languageCode = $selectedLanguage;
  $: currentTheme = $theme;

  // Share image URLs - use language, country, and theme specific images
  $: twitterImageUrl = browser
    ? `${window.location.origin}${base}/share/twitter/${storySlug}-${languageCode}-${countryCode}-${currentTheme}.png`
    : '';
  $: instagramImageUrl = browser
    ? `${window.location.origin}${base}/share/instagram/${storySlug}-${languageCode}-${countryCode}-${currentTheme}.png`
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

  function shareToInstagramStory() {
    // Show manual instructions modal first
    showInstagramInstructions = true;
  }

  async function shareWithInstagram() {
    // Try Web Share API Level 2 (with files) if supported
    if (browser && navigator.share && navigator.canShare) {
      try {
        // Fetch the image as a blob
        const response = await fetch(instagramImageUrl);
        const blob = await response.blob();

        // Create a File object
        const file = new File([blob], `${storySlug}-story.png`, { type: 'image/png' });

        // Check if we can share files
        const shareData = {
          files: [file],
          title: title,
          text: text,
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          closeInstructions();
          return; // Successfully shared
        }
      } catch (err) {
        console.log('File sharing not supported or failed:', err);
      }
    }

    // If Web Share API doesn't work, open the image in a new tab
    window.open(instagramImageUrl, '_blank', 'noopener,noreferrer');
  }

  function closeInstructions() {
    showInstagramInstructions = false;
  }

  async function copyLinkForInstagram() {
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

<!-- Instagram Instructions Modal -->
{#if showInstagramInstructions}
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={closeInstructions}
    on:keydown={(e) => e.key === 'Escape' && closeInstructions()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="instagram-modal-title"
  >
    <div
      class="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl max-w-md w-full p-6 space-y-6"
      on:click={(e) => e.stopPropagation()}
      role="document"
    >
      <div class="space-y-4">
        <h3 id="instagram-modal-title" class="text-xl font-bold text-white">
          Share to Instagram Story
        </h3>

        <p class="text-stone-300 text-sm">
          Follow these steps to share this story to your Instagram:
        </p>

        <ol class="space-y-4 text-stone-300 text-sm">
          <li class="flex gap-3">
            <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              1
            </span>
            <div class="flex-1">
              <p class="font-medium text-white mb-2">Copy the link to this story</p>
              <button
                on:click={copyLinkForInstagram}
                class="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-white text-xs transition-colors"
              >
                {showCopied ? '✓ Link Copied!' : 'Copy Link'}
              </button>
            </div>
          </li>

          <li class="flex gap-3">
            <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              2
            </span>
            <div class="flex-1">
              <p class="font-medium text-white">Click "Share to Instagram" below</p>
              <p class="text-xs text-stone-400 mt-1">
                This will open Instagram or show you the image to share
              </p>
            </div>
          </li>

          <li class="flex gap-3">
            <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              3
            </span>
            <div class="flex-1">
              <p class="font-medium text-white">Create a new Story with the image</p>
              <p class="text-xs text-stone-400 mt-1">
                Upload the share image to your Instagram Story
              </p>
            </div>
          </li>

          <li class="flex gap-3">
            <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs">
              4
            </span>
            <div class="flex-1">
              <p class="font-medium text-white">Add the link as a sticker</p>
              <p class="text-xs text-stone-400 mt-1">
                Tap the sticker icon, select "Link", and paste the URL you copied in step 1
              </p>
            </div>
          </li>
        </ol>
      </div>

      <button
        on:click={shareWithInstagram}
        class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded transition-colors inline-flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
        Share to Instagram
      </button>
    </div>
  </div>
{/if}
