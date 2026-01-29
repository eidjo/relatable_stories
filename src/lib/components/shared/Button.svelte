<script lang="ts">
  type ButtonVariant = 'primary' | 'secondary' | 'ghost';
  type ButtonSize = 'sm' | 'md' | 'lg';

  export let variant: ButtonVariant = 'primary';
  export let size: ButtonSize = 'md';
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white',
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseClasses =
    'font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
</script>

{#if href}
  <a {href} class={classes} class:pointer-events-none={disabled} aria-disabled={disabled}>
    <slot />
  </a>
{:else}
  <button {type} {disabled} class={classes} on:click>
    <slot />
  </button>
{/if}
