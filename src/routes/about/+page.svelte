<script lang="ts">
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { events } from '$lib/data/timeline';
  import { aboutContent } from '$lib/data/content';
</script>

<svelte:head>
  <title>About - Relatable Stories from Iran</title>
  <meta
    name="description"
    content="Learn about Iran's uprisings and how these stories are translated to build empathy and understanding."
  />
</svelte:head>

<div class="max-w-5xl mx-auto px-8 py-16 space-y-16 text-lg">
  <!-- Introduction -->
  <section class="space-y-4">
    <h1 class="text-4xl font-bold text-primary-500">{aboutContent.introduction.title}</h1>
    <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
      {#each aboutContent.introduction.content.split('\n\n') as paragraph}
        <p>{paragraph.trim()}</p>
      {/each}
    </div>
  </section>

  <!-- How it works -->
  <section class="space-y-4 border-t border-white/20 pt-12">
    <h2 class="text-3xl font-bold text-primary-500">{aboutContent.how_it_works.title}</h2>
    <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
      {#each aboutContent.how_it_works.content.split('\n\n') as paragraph}
        <p>{paragraph.trim()}</p>
      {/each}
    </div>
  </section>

  <!-- Background -->
  <section class="space-y-6 border-t border-white/20 pt-12">
    <h2 class="text-3xl font-bold text-primary-500">{aboutContent.background.title}</h2>

    {#each aboutContent.background.sections as section}
      <div class="space-y-3">
        <h3 class="text-2xl font-bold">{section.subtitle}</h3>
        <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
          {#each section.content.split('\n\n') as paragraph}
            <p>{paragraph.trim()}</p>
          {/each}
        </div>
      </div>
    {/each}
  </section>

  <!-- Timeline -->
  <section class="border-t border-white/20 pt-12">
    <Timeline {events} title="Complete Timeline of Events" />
  </section>

  <!-- Why it matters -->
  <section class="space-y-4 border-t border-white/20 pt-12">
    <h2 class="text-3xl font-bold text-primary-500">{aboutContent.why_it_matters.title}</h2>
    <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
      {#each aboutContent.why_it_matters.content.split('\n\n') as paragraph}
        <p>{paragraph.trim()}</p>
      {/each}
    </div>
  </section>

  <!-- Translation approach -->
  <section class="space-y-4 border-t border-white/20 pt-12">
    <h2 class="text-3xl font-bold text-primary-500">
      {aboutContent.translation_approach.title}
    </h2>
    <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
      {#each aboutContent.translation_approach.content.split('\n\n') as paragraph}
        <p>{paragraph.trim()}</p>
      {/each}
    </div>
  </section>

  <!-- Sources -->
  <section class="space-y-4 border-t border-white/20 pt-12">
    <h2 class="text-3xl font-bold text-primary-500">{aboutContent.sources.title}</h2>
    <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
      {#each aboutContent.sources.content.split('\n\n') as paragraph}
        <p>{paragraph.trim()}</p>
      {/each}
    </div>
  </section>

  <!-- Contribute -->
  <section class="space-y-4 border-t border-white/20 pt-12">
    <h2 class="text-3xl font-bold text-primary-500">{aboutContent.contribute.title}</h2>
    <div class="prose prose-invert max-w-none leading-relaxed opacity-90">
      {#each aboutContent.contribute.content.split('\n\n') as paragraph}
        <p>{paragraph.trim()}</p>
      {/each}
    </div>
  </section>

  <!-- Dedication -->
  <section class="border-t border-white/20 pt-12 pb-8">
    <div
      class="text-center space-y-4 py-8 px-6 border border-primary-500/30 rounded-lg bg-primary-950/20"
    >
      {#each aboutContent.dedication.content.split('\n\n') as paragraph}
        <p class="italic opacity-90">{paragraph.trim()}</p>
      {/each}
    </div>
  </section>
</div>
