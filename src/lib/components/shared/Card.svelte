<script lang="ts">
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  export let hover = false;

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer' : '';
</script>

<div
  class="bg-white rounded-lg shadow-md {paddingClasses[padding]} {hoverClass}"
  on:click
  on:keydown
  role={hover ? 'button' : undefined}
  tabindex={hover ? 0 : undefined}
>
  <slot />
</div>
