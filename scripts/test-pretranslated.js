/**
 * Test pre-translated file parsing
 * Verifies: paragraph breaks, source citations, date formatting, spacing
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function testPreTranslated() {
  console.log('🧪 Testing pre-translated file parsing\n');

  // Load Czech translation
  const translatedPath = path.join(rootDir, 'src', 'lib', 'data', 'stories', 'raha-2026', 'story.cs-cz.yaml');
  const translatedContent = await fs.readFile(translatedPath, 'utf8');
  const translatedStory = yaml.load(translatedContent);

  // Load original for markers
  const originalPath = path.join(rootDir, 'src', 'lib', 'data', 'stories', 'raha-2026', 'story.yaml');
  const originalContent = await fs.readFile(originalPath, 'utf8');
  const originalStory = yaml.load(originalContent);

  console.log('=== Pre-translated Content Analysis ===');
  console.log('Language: Czech (cs-CZ)');
  console.log('Content length:', translatedStory.content.length);
  console.log('Newlines:', (translatedStory.content.match(/\n/g) || []).length);
  console.log('Paragraph breaks (\\n\\n):', (translatedStory.content.match(/\n\n/g) || []).length);

  // Count markers
  const markerCount = (translatedStory.content.match(/\[\[MARKER:/g) || []).length;
  const dateCount = (translatedStory.content.match(/\{\{date:/g) || []).length;
  const sourceCount = (translatedStory.content.match(/\{\{source:/g) || []).length;
  const imageCount = (translatedStory.content.match(/\{\{image:/g) || []).length;

  console.log('\n=== Marker Counts ===');
  console.log('[[MARKER:...]] format:', markerCount);
  console.log('{{date:...}} markers:', dateCount);
  console.log('{{source:...}} markers:', sourceCount);
  console.log('{{image:...}} markers:', imageCount);

  // Check if original has these markers
  console.log('\n=== Original Story Markers ===');
  console.log('Has protest-date marker:', originalStory.markers['protest-date'] ? '✓' : '✗');
  console.log('Date value:', originalStory.markers['protest-date']?.value);
  console.log('Has death-toll source:', originalStory.markers['death-toll'] ? '✓' : '✗');
  console.log('Has hospital-executions source:', originalStory.markers['hospital-executions'] ? '✓' : '✗');

  // Preview content
  console.log('\n=== Content Preview (first 300 chars) ===');
  console.log(translatedStory.content.substring(0, 300).replace(/\n/g, '\\n'));

  console.log('\n✅ Test complete');
}

testPreTranslated().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
