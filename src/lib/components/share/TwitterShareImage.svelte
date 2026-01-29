<svelte:options css="injected" />

<script lang="ts">
  import TranslatedTextWithOriginal from './TranslatedTextWithOriginal.svelte';
  import type { TranslatedStory } from '$lib/types';

  let {
    story,
    countryName,
    theme = 'dark',
  }: { story: TranslatedStory; countryName: string; theme?: 'dark' | 'light' } = $props();

  const bgColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#0a0a0a';
  const textMuted = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 10, 10, 0.7)';
  const primaryColor = theme === 'dark' ? '#ef4444' : '#dc2626';

  // Get first few paragraphs of content
  const contentSegments = story.content.slice(0, 200);
</script>

<div
  class="relative font-mono"
  style="
    width: 1200px;
    height: 675px;
    background-color: {bgColor};
    color: {textColor};
    padding: 60px;
  "
>
  <!-- Red accent bar -->
  <div
    style="
      position: absolute;
      left: 0;
      top: 0;
      width: 8px;
      height: 100%;
      background-color: {primaryColor};
    "
  ></div>

  <!-- Title -->
  <div style="margin-bottom: 40px; font-size: 54px; font-weight: bold; line-height: 1.2;">
    <TranslatedTextWithOriginal segments={story.title} inline />
  </div>

  <!-- Content excerpt -->
  <div
    style="margin-bottom: 40px; font-size: 28px; line-height: 1.8; color: {textMuted}; max-height: 300px; overflow: hidden;"
  >
    <TranslatedTextWithOriginal segments={contentSegments} inline />
  </div>

  <!-- Footer -->
  <div style="position: absolute; bottom: 60px; left: 60px; right: 60px;">
    <div style="font-size: 22px; font-weight: bold; color: {primaryColor}; margin-bottom: 16px;">
      Translated for {countryName}
    </div>
    <div style="font-size: 26px; font-weight: bold;">Relatable Stories from Iran</div>
    <div style="font-size: 20px; color: {textMuted}; margin-top: 12px;">
      Experience stories in your local context
    </div>
  </div>
</div>
