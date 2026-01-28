<script lang="ts">
  import type { Action } from '$lib/types';
  import ActionCard from './ActionCard.svelte';

  export let globalActions: Action[];
  export let countryActions: Action[] = [];
  export let countryName: string = '';
</script>

<div class="space-y-12">
  <!-- Global actions -->
  {#if globalActions.length > 0}
    <section class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-3xl font-bold text-primary-500">Ways to Help</h2>
        <p class="text-sm opacity-70">
          These actions can make a difference from anywhere in the world.
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        {#each globalActions as action (action.id)}
          <ActionCard {action} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- Country-specific actions -->
  {#if countryActions.length > 0}
    <section class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-3xl font-bold text-primary-500">
          Actions for {countryName || 'Your Country'}
        </h2>
        <p class="text-sm opacity-70">
          These actions are specific to your country and can have direct political impact.
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        {#each countryActions as action (action.id)}
          <ActionCard {action} />
        {/each}
      </div>
    </section>
  {/if}

  <!-- No actions message -->
  {#if globalActions.length === 0 && countryActions.length === 0}
    <div class="text-center py-12 opacity-70">
      <p>No actions available at this time.</p>
    </div>
  {/if}
</div>
