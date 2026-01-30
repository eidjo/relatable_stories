# Architecture: Static Site with Build-Time Pipeline

This is a fully static site. All dynamic content is generated at build time.

## 🏗️ Build Process

```bash
npm run build
```

**Steps:**

1. **Validate** - TypeScript checks
2. **Generate Share Images** - Pipeline runs to create 148 social media images
3. **Build** - SvelteKit builds static site

**Result:** `build/` directory with fully static assets ready to deploy

## 📊 Translation Architecture

### Build-Time Operations (Node.js)

#### 1. Share Images (`scripts/generate-share-images-v3.js`)

- Uses **pipeline** (`src/lib/translation/pipeline.ts`)
- Generates 148 PNG files (Twitter 1200x630, Instagram 1080x1920)
- Output: `static/share/twitter/*.png`, `static/share/instagram/*.png`
- **Comparisons included**: "approximately", fractional phrases, multipliers

#### 2. Pre-Translation Script (`scripts/translate-stories.js`)

- Generates translated YAML files for each language/country combination
- Meant to bootstrap for a human-in-the-loop, the output should be generated once and then fixed manually. This content shouldn't change very often.
- Uses **same comparison logic** as pipeline
- Output: `src/lib/data/stories/*/story.{lang}-{country}.yaml`
- Run manually: `npm run translate -- --story=raha-2026 --force`

### Runtime (Browser)

#### Website (`src/routes/stories/[slug]/+page.svelte`)

- Uses **old translator** (`src/lib/translation/translator.ts`)
- Loads pre-translated YAML files
- Parses `[[MARKER:...]]` format
- **No filesystem access** - works entirely client-side

## 🎯 Comparison Features

### Where They Work

✅ **Share Images** - Generated at build time with pipeline

- Fractional comparisons: "a third of", "half of", "two-thirds of"
- Approximately: Within 15% margin (0.85-1.15x)
- Multipliers: "twice", "three times", "48 times"
- Renders in red italic text

✅ **Website** - After running translation script

- Same features as share images
- Baked into pre-translated YAML files
- Need to regenerate files to get latest comparisons

### How Comparisons Work

1. **Scale casualties** by population ratio (Iran → Target Country)
2. **Find closest event** in requested category (e.g., "massacre")
3. **Generate comparison text** based on ratio:
   - 0.85-1.15x → "approximately [event]"
   - <0.85x → Fractional phrases
   - > 1.15x → Multipliers

## 📁 Key Files

### Pipeline (Build-Time Only)

- `src/lib/translation/pipeline.ts` - Main translation engine
- `src/lib/translation/core.ts` - Marker translation logic with comparisons
- `scripts/renderers/canvas-renderer.js` - Image rendering
- `scripts/generate-share-images-v3.js` - Share image generation

### Website (Runtime)

- `src/lib/translation/translator.ts` - Browser-compatible translator
- `src/lib/translation/pretranslated-parser.ts` - Parses `[[MARKER:...]]` format
- `src/lib/components/story/StoryDetail.svelte` - Story display component

### Translation Script (Manual)

- `scripts/translate-stories.js` - Pre-translation with AI (requires ANTHROPIC_API_KEY)

## 🚀 Deployment

This is being deployed to GitHub pages via an action

**No server required!**

## 🔄 Updating Content

### To add comparisons to website:

```bash
npm run translate -- --story=raha-2026 --force
npm run build
```

### To regenerate share images:

```bash
npm run generate-share-images
npm run build
```

### To deploy:

```bash
npm run build
# Upload build/ directory to your host
```

## 🎨 Why This Architecture?

1. **Performance** - Everything pre-rendered, no server-side processing
2. **Cost** - Static hosting is cheap/free
3. **Reliability** - No server to crash, no API rate limits
4. **Simplicity** - Just upload files, no infrastructure management

The pipeline handles complex logic (comparisons, scaling, etc.) at build time, so the browser only needs to display pre-computed results.

## 📚 Documentation Map

For more detailed information on specific systems:

- **[Marker System](MARKER_SYSTEM.md)**: Detailed specification of the V2 marker system (people, places, numbers, etc.).
- **[Adding Countries](ADD_COUNTRY_SUPPORT.md)**: Guide to adding support for new countries.
