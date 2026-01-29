/**
 * AI-powered story translation script
 * Translates stories to multiple languages while preserving {{marker}} placeholders
 *
 * Usage:
 *   npm run translate              # Translate all stories to all languages
 *   npm run translate -- --lang=fr # Translate to French only
 *   npm run translate -- --story=mahsa-arrest  # Translate one story only
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { existsSync } from 'fs';
import path from 'path';

const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fa', name: 'Persian/Farsi' },
];

// Parse CLI arguments
const args = process.argv.slice(2);
const targetLang = args.find(arg => arg.startsWith('--lang='))?.split('=')[1];
const targetStory = args.find(arg => arg.startsWith('--story='))?.split('=')[1];

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
  console.log('   Set it with: export ANTHROPIC_API_KEY=your-key-here');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function translateStory(storyContent, targetLangCode, targetLangName, storyId) {
  console.log(`   Translating to ${targetLangName}...`);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.3, // Lower temperature for more consistent translations
      messages: [{
        role: 'user',
        content: `You are translating a story about Iran's uprising for an activist website. Translate this YAML story from English to ${targetLangName}.

The story contains {{marker:key}} placeholders. These will be replaced at display time with culturally-appropriate values (e.g., American names for US readers).

YOUR TASK:
1. Keep ALL {{marker:key}} placeholders EXACTLY as they are - DO NOT translate or remove them
2. Translate the surrounding text naturally to ${targetLangName}
3. Make sure the grammar works for any name/place that might replace the markers
4. Maintain emotional tone - this is about real suffering
5. Preserve YAML structure, field names, and paragraph breaks (\\n\\n)

IMPORTANT FOR GRAMMAR:
- The markers will be replaced with names like "Kristina", "Sophie", etc. at runtime
- Make sure your translation works grammatically when these replacements happen
- Use neutral/flexible grammar constructions where needed

EXAMPLE:

English input:
"{{name:person1}} was arrested. They took {{name:person1}} to prison."

${targetLangName} output (if French):
"{{name:person1}} a été arrêté(e). Ils ont emmené {{name:person1}} en prison."

The {{name:person1}} markers stay unchanged, but surrounding grammar is translated.

YAML to translate:
${storyContent}

Return ONLY the translated YAML, no explanations.`
      }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error(`   ❌ Translation failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🌍 Story Translation Tool\n');

  // Determine which languages to translate to
  const languages = targetLang
    ? SUPPORTED_LANGUAGES.filter(l => l.code === targetLang)
    : SUPPORTED_LANGUAGES;

  if (languages.length === 0) {
    console.error(`❌ Unknown language code: ${targetLang}`);
    console.log('Supported languages:', SUPPORTED_LANGUAGES.map(l => l.code).join(', '));
    process.exit(1);
  }

  // Find stories to translate
  const storyPattern = targetStory
    ? `src/lib/data/stories/${targetStory}/story.yaml`
    : 'src/lib/data/stories/*/story.yaml';

  const storyFiles = await glob(storyPattern);

  if (storyFiles.length === 0) {
    console.error(`❌ No stories found matching: ${storyPattern}`);
    process.exit(1);
  }

  console.log(`📚 Found ${storyFiles.length} story/stories`);
  console.log(`🌐 Translating to ${languages.length} language(s): ${languages.map(l => l.name).join(', ')}\n`);

  let totalTranslated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const storyFile of storyFiles) {
    const storyId = path.basename(path.dirname(storyFile));
    const storyDir = path.dirname(storyFile);

    console.log(`📖 ${storyId}`);

    const content = await readFile(storyFile, 'utf-8');

    for (const lang of languages) {
      const outputPath = path.join(storyDir, `story.${lang.code}.yaml`);

      // Skip if translation already exists
      if (existsSync(outputPath)) {
        console.log(`   ⏭️  ${lang.name} - already exists (skipping)`);
        totalSkipped++;
        continue;
      }

      const translated = await translateStory(content, lang.code, lang.name, storyId);

      if (translated) {
        await writeFile(outputPath, translated, 'utf-8');
        console.log(`   ✅ ${lang.name} - translated`);
        totalTranslated++;
      } else {
        console.log(`   ❌ ${lang.name} - failed`);
        totalFailed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Translated: ${totalTranslated}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (totalFailed > 0) {
    console.log('\n⚠️  Some translations failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
