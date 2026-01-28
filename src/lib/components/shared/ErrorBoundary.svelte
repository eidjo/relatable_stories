<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ErrorFallback from './ErrorFallback.svelte';

  // Props
  export let fallback: any = ErrorFallback;
  export let onError: ((error: Error) => void) | undefined = undefined;

  // State
  let error: Error | null = null;
  let errorInfo: any = null;

  /**
   * Handle errors from child components
   */
  function handleError(event: ErrorEvent) {
    error = event.error;
    errorInfo = {
      componentStack: event.filename || 'unknown',
      message: event.message,
    };

    // Call optional error handler
    if (onError) {
      onError(event.error);
    }

    // Prevent default error handling (console logging is okay)
    event.preventDefault();
  }

  /**
   * Handle promise rejections
   */
  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    errorInfo = {
      componentStack: 'Promise rejection',
      message: String(event.reason),
    };

    if (onError) {
      onError(error);
    }

    event.preventDefault();
  }

  /**
   * Reset error state to try rendering again
   */
  function reset() {
    error = null;
    errorInfo = null;
  }

  // Setup error listeners on mount
  onMount(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
  });

  // Cleanup error listeners on destroy
  onDestroy(() => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
</script>

{#if error}
  <svelte:component this={fallback} {error} {errorInfo} {reset} />
{:else}
  <slot />
{/if}
