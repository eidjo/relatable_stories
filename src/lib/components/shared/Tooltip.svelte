<script lang="ts">
  import { fade } from 'svelte/transition';

  export let text: string;
  export let show = false;
</script>

{#if show}
  <div
    class="absolute z-50 px-3 py-2 text-xs bg-primary-600 text-white rounded shadow-lg pointer-events-none whitespace-nowrap font-mono"
    style="bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px);"
    transition:fade={{ duration: 150 }}
  >
    {text}
    <div
      class="absolute w-2 h-2 bg-primary-600 transform rotate-45"
      style="top: 100%; left: 50%; margin-left: -4px; margin-top: -4px;"
    ></div>
  </div>
{/if}
