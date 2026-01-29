<svelte:options css="injected" />

<script lang="ts">
  import TranslatedTextWithOriginal from './TranslatedTextWithOriginal.svelte';
  import type { TranslatedStory } from '$lib/types';

  let { story, countryName, theme = 'dark' }: { story: TranslatedStory; countryName: string; theme?: 'dark' | 'light' } = $props();

  const bgColor = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#0a0a0a';
  const textMuted = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(10, 10, 10, 0.7)';
  const primaryColor = theme === 'dark' ? '#ef4444' : '#dc2626';

  // Get more content for vertical format
  const contentSegments = story.content.slice(0, 400);
</script>

<div
  class="relative font-mono"
  style="
    width: 1080px;
    height: 1920px;
    background-color: {bgColor};
    color: {textColor};
    padding: 60px;
  "
>
  <!-- Red accent bar on top -->
  <div
    style="
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 12px;
      background-color: {primaryColor};
    "
  ></div>

  <!-- Title -->
  <div style="margin-top: 80px; margin-bottom: 50px; font-size: 64px; font-weight: bold; line-height: 1.2;">
    <TranslatedTextWithOriginal segments={story.title} inline />
  </div>

  <!-- Content excerpt -->
  <div style="margin-bottom: 60px; font-size: 32px; line-height: 1.8; color: {textMuted}; max-height: 900px; overflow: hidden;">
    <TranslatedTextWithOriginal segments={contentSegments} inline />
  </div>

  <!-- Footer -->
  <div style="position: absolute; bottom: 60px; left: 60px; right: 60px;">
    <div style="font-size: 26px; font-weight: bold; color: {primaryColor}; margin-bottom: 20px;">
      Translated for {countryName}
    </div>
    <div style="font-size: 22px; color: {textMuted}; margin-bottom: 20px;">
      {story.date} • {story.severity}
    </div>
    <div style="font-size: 28px; color: {primaryColor}; margin-bottom: 24px;">
      {#if story.tags}
        #{story.tags.slice(0, 3).join(' #')}
      {/if}
    </div>
    <div style="font-size: 30px; font-weight: bold; margin-bottom: 20px;">
      Read the full story →
    </div>
    <div style="font-size: 24px; color: {textMuted};">
      Link in Story
    </div>
  </div>
</div>
