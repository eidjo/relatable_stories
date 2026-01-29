<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let hover = false;

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hover
    ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer'
    : '';
</script>

{#if hover}
  <button
    type="button"
    class="card-base card-shadow rounded-lg {paddingClasses[
      padding
    ]} {hoverClass} w-full text-left border-none"
    on:click
    on:keydown
  >
    <slot />
  </button>
{:else}
  <div class="card-base card-shadow rounded-lg {paddingClasses[padding]}">
    <slot />
  </div>
{/if}
