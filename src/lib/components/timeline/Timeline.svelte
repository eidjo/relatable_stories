<script lang="ts">
  import type { TimelineEvent as TimelineEventType } from '$lib/types';
  import TimelineEvent from './TimelineEvent.svelte';

  export let events: TimelineEventType[];
  export let title: string = 'Timeline';

  // Sort events by date (newest first)
  $: sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
</script>

<div class="space-y-6">
  <!-- Timeline header -->
  <div class="space-y-2">
    <h2 class="text-3xl font-bold text-primary-500">{title}</h2>
    <p class="text-sm opacity-70">
      Key events from Iran's uprisings. Events are color-coded by severity.
    </p>
  </div>

  <!-- Timeline events -->
  <div class="relative">
    {#each sortedEvents as event (event.date + event.title)}
      <TimelineEvent {event} />
    {/each}
  </div>

  <!-- Legend -->
  <div class="border-t border-white/20 pt-6 mt-8">
    <h3 class="text-sm font-bold mb-3 opacity-70">Severity Legend</h3>
    <div class="flex flex-wrap gap-4 text-xs">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-600"></div>
        <span class="opacity-70">Critical</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-500"></div>
        <span class="opacity-70">High</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-yellow-600"></div>
        <span class="opacity-70">Medium</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-gray-500"></div>
        <span class="opacity-70">Low</span>
      </div>
    </div>
  </div>
</div>
