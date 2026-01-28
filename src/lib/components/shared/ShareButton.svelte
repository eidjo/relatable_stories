<script lang="ts">
  import { browser } from '$app/environment';

  export let url: string;
  export let title: string;
  export let text: string = '';

  let showCopied = false;
  let supportsWebShare = false;

  // Check if Web Share API is supported
  $: if (browser) {
    supportsWebShare = 'share' in navigator;
  }

  async function handleShare() {
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
</script>

<button
  on:click={handleShare}
  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors text-sm font-medium inline-flex items-center gap-2"
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
    <span>Share Story</span>
  {/if}
</button>
