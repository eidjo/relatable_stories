<script lang="ts">
  import type { TimelineEvent } from '$lib/types';
  import { format } from 'date-fns';

  export let event: TimelineEvent;

  const severityColors = {
    critical: 'border-red-600 bg-red-950/50',
    high: 'border-red-500 bg-red-900/30',
    medium: 'border-yellow-600 bg-yellow-950/30',
    low: 'border-gray-500 bg-gray-900/30',
  };

  const severityDots = {
    critical: 'bg-red-600',
    high: 'bg-red-500',
    medium: 'bg-yellow-600',
    low: 'bg-gray-500',
  };

  $: formattedDate = format(new Date(event.date), 'MMMM d, yyyy');
</script>

<div class="relative pl-8 pb-8 last:pb-0">
  <!-- Timeline line -->
  <div class="absolute left-[7px] top-2 bottom-0 w-px bg-white/20"></div>

  <!-- Timeline dot -->
  <div
    class="absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-gray-950 {severityDots[
      event.severity
    ]}"
  ></div>

  <!-- Event card -->
  <div class="border rounded-lg p-4 {severityColors[event.severity]}">
    <!-- Date -->
    <div class="text-xs text-primary-500 font-bold uppercase tracking-wide mb-2">
      {formattedDate}
    </div>

    <!-- Title -->
    <h3 class="text-lg font-bold mb-2">{event.title}</h3>

    <!-- Description -->
    <p class="text-sm opacity-80 leading-relaxed mb-3">
      {event.description}
    </p>

    <!-- Source link -->
    {#if event.source}
      <a
        href={event.source}
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-primary-500 hover:text-primary-600 underline inline-flex items-center gap-1"
      >
        View source →
      </a>
    {/if}
  </div>
</div>
