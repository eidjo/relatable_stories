<script lang="ts">
  import type { Action } from '$lib/types';

  export let action: Action;

  const typeColors = {
    social: 'border-blue-600 bg-blue-950/30',
    education: 'border-purple-600 bg-purple-950/30',
    political: 'border-red-600 bg-red-950/30',
    donate: 'border-green-600 bg-green-950/30',
    advocacy: 'border-yellow-600 bg-yellow-950/30',
    local: 'border-gray-600 bg-gray-950/30',
  };

  const typeLabels = {
    social: 'Social',
    education: 'Education',
    political: 'Political',
    donate: 'Donate',
    advocacy: 'Advocacy',
    local: 'Local Action',
  };
</script>

<div class="border rounded-lg p-6 {typeColors[action.type]} space-y-4">
  <!-- Type badge -->
  <div class="inline-block">
    <span
      class="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded bg-white/10 opacity-70"
    >
      {typeLabels[action.type]}
    </span>
  </div>

  <!-- Title -->
  <h3 class="text-xl font-bold">{action.title}</h3>

  <!-- Description -->
  <p class="text-sm opacity-80 leading-relaxed">
    {action.description}
  </p>

  <!-- Links -->
  {#if action.links && action.links.length > 0}
    <div class="space-y-2 pt-2">
      {#each action.links as link}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          class="block text-sm text-primary-500 hover:text-primary-600 underline"
        >
          {link.title || link.platform || 'Learn more'} →
        </a>
      {/each}
    </div>
  {/if}
</div>
