<script lang="ts">
  export let error: Error;
  export let errorInfo: any;
  export let reset: () => void;

  // Check if we're in development mode
  const isDev = import.meta.env.DEV;
</script>

<div class="error-boundary min-h-[200px] flex items-center justify-center p-8" role="alert">
  <div class="max-w-2xl w-full text-center">
    <!-- Error Icon -->
    <div class="text-red-500 text-5xl mb-4" aria-hidden="true">⚠️</div>

    <!-- Error Message -->
    <h2 class="text-2xl font-bold mb-4">Something went wrong</h2>
    <p class="text-gray-600 dark:text-gray-400 mb-6">
      We encountered an error while displaying this content. Please try again or refresh the page.
    </p>

    <!-- Development Details -->
    {#if isDev}
      <details class="text-left mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        <summary class="cursor-pointer font-semibold p-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          Error Details (dev only)
        </summary>
        <div class="p-4 border-t border-gray-300 dark:border-gray-700">
          <pre class="text-xs overflow-auto whitespace-pre-wrap break-words">{error.message}\n\n{error.stack}</pre>
        </div>
      </details>
    {/if}

    <!-- Action Buttons -->
    <div class="flex gap-4 justify-center">
      <button
        on:click={reset}
        class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
      >
        Try Again
      </button>
      <button
        on:click={() => window.location.reload()}
        class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
      >
        Refresh Page
      </button>
    </div>
  </div>
</div>

<style>
  .error-boundary {
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
