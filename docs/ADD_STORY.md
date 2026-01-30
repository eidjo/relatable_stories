# Adding a New Story

This guide walks you through adding a new story to the Relatable Stories application.

## Overview

Stories in this application are:
- Written in English with markers for names, places, and numbers
- Translated contextually based on the reader's country
- Validated automatically by tests
- Optionally pre-translated to other languages for better readability

## Prerequisites

Before adding a story:
- Understand the [V2 Marker System](MARKER_SYSTEM.md)
- Review [Country Support Guide](ADD_COUNTRY_SUPPORT.md) for context data
- Familiarize yourself with existing stories in `src/lib/data/stories/`

## Step-by-Step Process

### 1. Create Story Directory

Create a new directory under `src/lib/data/stories/` with a slug (kebab-case) identifier:

```bash
mkdir src/lib/data/stories/your-story-slug
```

### 2. Write `story.yaml`

Create `story.yaml` in your story directory. Use the V2 marker format:

```yaml
id: 'your-story-slug'
title: 'Story Title'
slug: 'your-story-slug'
date: '2022-XX-XX'
summary: "Brief description of the story"

content: >-
  Your story content goes here. Use markers like {{place-name}} for places,
  {{person-name}} for people, and {{number-name}} for numbers that should scale.

  Paragraphs are separated by blank lines.

  You can reference markers multiple times, and use suffixes like {{casualties:comparable}}
  for special formatting.

markers:
  # People
  person-name:
    person: 'Original Name'
    gender: f
    age: 22

  # Places (hierarchical)
  tehran:
    place: 'Tehran'
    city-large: true
    capital: true
    population: 9500000

  landmark:
    place: 'Landmark Name'
    landmark-protest: true
    within: tehran

  # Numbers with scaling
  casualties:
    casualties: 1000
    killed: true
    scope: country
    comparable: massacre

  time-period:
    number: 5
    days: true

# Optional: Sources
sources:
  - id: source-id
    number: 1
    title: 'Source Title'
    url: 'https://example.com'

# Optional: Images
images:
  - id: image-id
    src: '/image-filename.jpg'
    alt: 'Image description'
    caption: 'Image caption'
    contentWarning: 'Warning if graphic'

tags: ['tag1', 'tag2', 'theme']
hashtags: '#Iran #HumanRights #Topic'
severity: critical
verified: true
source: 'Source of the story'
contentWarning: "Content warnings if applicable"

meta:
  og-title: 'Social Media Title'
  og-description: "Social media description"
```

### 3. YAML Formatting Rules

**CRITICAL**: YAML is whitespace-sensitive. Follow these rules:

#### Apostrophes/Quotes
```yaml
# ❌ WRONG - Single quotes with apostrophe causes parse error
summary: 'A person's story'

# ✅ CORRECT - Use double quotes when text contains apostrophes
summary: "A person's story"

# ✅ ALSO CORRECT - Escape apostrophes in single quotes
summary: 'A person''s story'
```

#### Indentation
- Use **2 spaces** per level (never tabs)
- Be consistent throughout the file
- Check examples in existing stories

#### Multi-line Content
```yaml
# Use >- for content that should preserve paragraph breaks
content: >-
  First paragraph.

  Second paragraph.
```

### 4. Register Story in Index

Edit `src/lib/data/stories/index.ts`:

```typescript
// 1. Add import at the top
import yourStoryYaml from './your-story-slug/story.yaml?raw';

// 2. Add to storyFiles array
const storyFiles = [
  mahsaArrestYaml,
  raha2026Yaml,
  yourStoryYaml,  // Add here
];
```

### 5. Validate Story

Run tests to ensure your story is properly formatted:

```bash
npm test
```

This will validate:
- ✅ YAML syntax is correct
- ✅ All required fields are present
- ✅ Markers are properly defined
- ✅ References to markers are valid
- ✅ Story structure matches schema

If tests fail, check the error message. Common issues:
- **YAML parse error**: Check quotes, indentation, apostrophes
- **Missing markers**: Ensure all `{{marker}}` references have definitions
- **Invalid marker properties**: Check against V2 marker types

### 6. TypeScript Check

Verify TypeScript types:

```bash
npm run check
```

Should complete with 0 errors.

### 7. Test Locally

Start the dev server to see your story:

```bash
npm run dev
```

Navigate to `http://localhost:5173/stories` to see the story list, or `http://localhost:5173/stories/your-story-slug` to view it.

Test with different countries:
- Change the country selector in the UI
- Verify names, places, and numbers translate appropriately
- Check that casualties comparisons work correctly

### 8. Add Images (Optional)

If your story includes images:

1. **Add image file** to `static/` directory:
   ```bash
   cp your-image.jpg static/story-image.jpg
   ```

2. **Reference in story.yaml**:
   ```yaml
   images:
     - id: image-id
       src: '/story-image.jpg'
       alt: 'Description'
       caption: 'Caption text'
       contentWarning: 'Warning if graphic'
       credit: 'Photo credit'
       creditUrl: 'https://source.com'
   ```

3. **Use in content**:
   ```yaml
   content: >-
     Text before image.

     {{image:image-id}}

     Text after image.
   ```

### 9. Pre-translate to Other Languages (Optional)

For better readability, you can provide pre-translated versions:

1. **Create translated file**: `story.{lang}-{country}.yaml`
   ```bash
   # Example: Czech translation for Czech Republic
   touch src/lib/data/stories/your-story-slug/story.cs-cz.yaml
   ```

2. **Use marker syntax**: `[[MARKER:type:key:original|translated]]`
   ```yaml
   content: >-
     [[MARKER:place:tehran:Tehran|Praha]] is a city...
   ```

3. **Copy markers object** from original story.yaml

4. **Test translation** by selecting the language in the UI

See existing translated stories for examples (e.g., `mahsa-arrest/story.cs-cz.yaml`).

### 10. Generate Share Images (Production)

Share images are generated at build time:

```bash
npm run generate-share-images
```

This creates social media preview images in:
- `static/share/twitter/` - Twitter/X format
- `static/share/instagram/` - Instagram Stories format

**Note**: Share images are gitignored and regenerated during deployment.

## Best Practices

### Content Guidelines

1. **Accuracy**: Verify facts and cite sources
2. **Sensitivity**: Use content warnings for graphic content
3. **Respect**: Handle traumatic stories with care
4. **Clarity**: Write clearly and avoid jargon

### Marker Selection

1. **Names**: Mark all person names for cultural translation
2. **Places**: Mark cities, landmarks, facilities for local context
3. **Numbers**: Mark quantities that should scale (casualties, cities)
4. **Don't over-mark**: Simple words, actions don't need markers

### Casualties Numbers

```yaml
# Nationwide event - scale against country population
killed:
  casualties: 1000
  killed: true
  scope: country
  comparable: massacre

# City-specific event - scale against city population
killed-city:
  casualties: 100
  killed: true
  scope: city
  scopeCity: tehran  # Reference to city marker
  comparable: massacre
```

### Hierarchical Places

Always use `within` for landmarks inside cities:

```yaml
tehran:
  place: 'Tehran'
  city-large: true

square:
  place: 'Azadi Square'
  landmark-protest: true
  within: tehran  # ✅ Links to specific city
```

## Troubleshooting

### YAML Parse Errors

**Error**: `bad indentation of a mapping entry`

**Cause**: Apostrophes in single-quoted strings

**Fix**: Use double quotes for strings with apostrophes:
```yaml
# ❌ Wrong
title: 'Person's Story'

# ✅ Correct
title: "Person's Story"
```

### Story Not Appearing

**Issue**: Story doesn't show in the list

**Check**:
1. ✅ Story imported in `index.ts`
2. ✅ Story added to `storyFiles` array
3. ✅ No validation errors (run `npm test`)
4. ✅ Browser cache cleared (hard refresh)

### Markers Not Translating

**Issue**: Markers show as `{{marker-name}}` instead of translating

**Check**:
1. ✅ Marker is defined in `markers:` section
2. ✅ Marker key matches exactly (case-sensitive)
3. ✅ Context data exists for target country
4. ✅ No typos in marker references

### Casualties Not Comparing

**Issue**: `{{casualties:comparable}}` not showing comparison

**Check**:
1. ✅ Marker has `comparable: massacre` (or other category)
2. ✅ Target country has comparable events defined
3. ✅ Check `src/lib/data/contexts/comparable-events.yaml`

## Example: Complete Story

See `src/lib/data/stories/ride-home/story.yaml` for a complete example of:
- ✅ First-person narrative style
- ✅ Multiple place types (cities, facilities)
- ✅ Time period numbers
- ✅ Casualties with scaling and comparisons
- ✅ Proper YAML formatting
- ✅ Rich metadata

## Testing Checklist

Before considering a story complete:

- [ ] YAML syntax validates (`npm test`)
- [ ] TypeScript check passes (`npm run check`)
- [ ] Story appears in list at `/stories`
- [ ] Story detail page loads at `/stories/your-slug`
- [ ] Names translate correctly for different countries
- [ ] Places translate to local equivalents
- [ ] Numbers scale appropriately
- [ ] Casualties show relevant comparisons
- [ ] Sources render as `[1]`, `[2]` citations
- [ ] Images display correctly (if included)
- [ ] Metadata (title, summary, tags) is accurate
- [ ] Content warnings are appropriate
- [ ] Hashtags are relevant

## Getting Help

If stuck:
1. **Review examples**: Study existing stories in `src/lib/data/stories/`
2. **Check tests**: Test output shows specific validation errors
3. **Read docs**:
   - [Marker System Reference](MARKER_SYSTEM.md)
   - [Country Support Guide](ADD_COUNTRY_SUPPORT.md)
4. **Ask questions**: Create an issue with details

## Summary

Adding a story requires:
1. ✅ Create `story.yaml` with proper V2 markers
2. ✅ Register in `src/lib/data/stories/index.ts`
3. ✅ Validate with `npm test`
4. ✅ Test locally with different countries
5. ✅ Optionally add images and pre-translations

The key is using markers effectively to make Iranian stories relatable to readers worldwide through contextual translation of names, places, and numbers.
