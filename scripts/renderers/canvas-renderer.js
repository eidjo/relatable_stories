/**
 * Canvas renderer for pipeline-generated segments
 * Renders NormalizedSegment[] to canvas for share image generation
 */

import { createCanvas } from '@napi-rs/canvas';

// Dark theme colors (matching website)
const COLORS = {
  background: '#0a0a0a',
  primary: '#ef4444',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.7)',
  strikethrough: 'rgba(255, 255, 255, 0.3)',
};

/**
 * Draw text segments with proper word wrapping and strikethrough
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {NormalizedSegment[]} segments - Segments from pipeline
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} maxWidth - Maximum width for text
 * @param {number} maxHeight - Maximum height (Y position limit)
 * @param {number} fontSize - Font size in pixels
 * @returns {number} Final Y position reached
 */
export function drawSegmentedText(ctx, segments, x, y, maxWidth, maxHeight, fontSize) {
  ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

  let currentX = x;
  let currentY = y;
  const lineHeight = fontSize * 1.4;
  const spaceWidth = ctx.measureText(' ').width;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Stop if we've reached max height
    if (currentY > maxHeight) {
      break;
    }

    // Skip image segments entirely
    if (segment.type === 'image') {
      continue;
    }

    // Handle paragraph breaks
    if (segment.type === 'paragraph-break') {
      currentX = x;
      currentY += lineHeight * 1.5;
      continue;
    }

    // Handle source citations (render as superscript footnotes)
    if (segment.type === 'source') {
      ctx.fillStyle = COLORS.primary;
      ctx.font = `bold ${Math.floor(fontSize * 0.7)}px "JetBrains Mono", monospace`;
      const width = ctx.measureText(segment.text).width;

      // Wrap to next line if needed
      if (currentX + width > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        // Draw superscript (higher position)
        ctx.fillText(segment.text, currentX, currentY - fontSize * 0.3);
      }
      currentX += width;
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      continue;
    }

    // Handle segments with original text (person, place markers)
    if (segment.original && segment.style === 'strikethrough-muted') {
      // Draw strikethrough original
      ctx.fillStyle = COLORS.strikethrough;
      const originalWidth = ctx.measureText(segment.original).width;

      // Wrap to next line if needed
      if (currentX + originalWidth > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(segment.original, currentX, currentY);

        // Draw strikethrough line (5px thick, same color as text)
        const lineY = currentY - fontSize * 0.3;
        ctx.strokeStyle = COLORS.strikethrough;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(currentX, lineY);
        ctx.lineTo(currentX + originalWidth, lineY);
        ctx.stroke();
      }

      currentX += originalWidth + spaceWidth;

      // Draw translated text in primary color
      ctx.fillStyle = COLORS.primary;
      const translatedWidth = ctx.measureText(segment.text).width;

      // Wrap to next line if needed
      if (currentX + translatedWidth > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(segment.text, currentX, currentY);
      }
      currentX += translatedWidth;

      // Reset to muted color for next segments
      ctx.fillStyle = COLORS.textMuted;
      continue;
    }

    // Handle comparison text (italic casualty comparisons in red)
    if (segment.style === 'italic-comparison') {
      ctx.fillStyle = COLORS.primary;
      ctx.font = `italic ${fontSize}px "JetBrains Mono", monospace`;

      const text = segment.text;
      const width = ctx.measureText(text).width;

      // Wrap to next line if needed
      if (currentX + width > x + maxWidth && currentX > x) {
        currentX = x;
        currentY += lineHeight;
      }

      if (currentY <= maxHeight) {
        ctx.fillText(text, currentX, currentY);
      }
      currentX += width;

      // Reset font and color
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = COLORS.textMuted;
      continue;
    }

    // Regular text segment - handle word wrapping
    const text = segment.text;
    ctx.fillStyle = COLORS.textMuted;

    // Handle leading spaces
    const leadingSpaces = text.match(/^\s+/)?.[0] || '';
    for (let i = 0; i < leadingSpaces.length; i++) {
      currentX += spaceWidth;
    }

    // Split by spaces and process words
    const trimmedText = text.trim();
    if (trimmedText) {
      const words = trimmedText.split(' ');

      for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
        const word = words[wordIdx];
        const wordWidth = ctx.measureText(word).width;

        // Wrap to next line if word doesn't fit
        if (currentX + wordWidth > x + maxWidth && currentX > x) {
          currentX = x;
          currentY += lineHeight;
        }

        if (currentY <= maxHeight) {
          ctx.fillText(word, currentX, currentY);
        }
        currentX += wordWidth;

        // Add space after word (except for last word)
        if (wordIdx < words.length - 1) {
          currentX += spaceWidth;
        }
      }
    }

    // Handle trailing spaces
    const trailingSpaces = text.match(/\s+$/)?.[0] || '';
    for (let i = 0; i < trailingSpaces.length; i++) {
      currentX += spaceWidth;
    }
  }

  return currentY;
}

/**
 * Render a translated story to Twitter-sized canvas (1200x630)
 * @param {TranslatedStory} translatedStory - Story from pipeline
 * @param {string} formattedDate - Localized date string
 * @returns {Canvas} Canvas with rendered image
 */
export function renderTwitterImage(translatedStory, formattedDate) {
  const WIDTH = 1200;
  const HEIGHT = 630;
  const PADDING = 60;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 42px "JetBrains Mono", monospace';
  const titleY = drawSegmentedText(
    ctx,
    translatedStory.title,
    PADDING,
    PADDING + 42,
    WIDTH - PADDING * 2,
    HEIGHT - 300,
    42
  );

  // Date
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText(formattedDate, PADDING, titleY + 35);

  // Content (first few paragraphs)
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '20px "JetBrains Mono", monospace';
  drawSegmentedText(
    ctx,
    translatedStory.content,
    PADDING,
    titleY + 70,
    WIDTH - PADDING * 2,
    HEIGHT - 120,
    20
  );

  // Footer
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText('Relatable Stories', PADDING, HEIGHT - 60);
  ctx.fillText('Stories from Iran, translated for your context', PADDING, HEIGHT - 30);

  return canvas;
}

/**
 * Render a translated story to Instagram-sized canvas (1080x1920)
 * @param {TranslatedStory} translatedStory - Story from pipeline
 * @param {string} formattedDate - Localized date string
 * @returns {Canvas} Canvas with rendered image
 */
export function renderInstagramImage(translatedStory, formattedDate) {
  const WIDTH = 1080;
  const HEIGHT = 1920;
  const PADDING = 80;
  const TOP_PADDING = 250; // Extra space for Instagram UI overlay

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Title (start lower for Instagram overlay)
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 52px "JetBrains Mono", monospace';
  const titleY = drawSegmentedText(
    ctx,
    translatedStory.title,
    PADDING,
    TOP_PADDING + 52,
    WIDTH - PADDING * 2,
    HEIGHT - 600,
    52
  );

  // Date
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '22px "JetBrains Mono", monospace';
  ctx.fillText(formattedDate, PADDING, titleY + 45);

  // Content (skip summary, go straight to content)
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '24px "JetBrains Mono", monospace';
  drawSegmentedText(
    ctx,
    translatedStory.content,
    PADDING,
    titleY + 90,
    WIDTH - PADDING * 2,
    HEIGHT - 200,
    24
  );

  // Footer
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '20px "JetBrains Mono", monospace';
  ctx.fillText('Relatable Stories', PADDING, HEIGHT - 120);
  ctx.fillText('Stories from Iran, translated for your context', PADDING, HEIGHT - 80);

  return canvas;
}
