# Relatable Stories

A web application that translates stories from Iran's 2022 uprising (and beyond) into your local context, helping you understand and empathize with the human cost of repression by mapping it to your own city, names, and familiar landmarks.

## Features

- **Contextual Translation**: Stories are adapted to use familiar names, places, and scaled numbers based on your country.
- **Hierarchical Place Mapping**: Landmarks, universities, and facilities are mapped to the specific cities mentioned in the story for geographic consistency.
- **Comparable Tragedies**: Casualties are scaled by population and compared to well-known local historical tragedies (e.g., "3x the 9/11 attacks" or "10x the Lidice massacre").
- **Interactive Tooltips**: Hover over any translated text to see the original Iranian details and the math behind the scaling.
- **"Original (Iran)" Mode**: View stories with their authentic Iranian context, names, and places.
- **Automatic Detection**: Detects your country via timezone/locale or lets you choose from 20+ supported countries.
- **Privacy-First**: No tracking, no data collection. All preferences are stored locally in your browser.
- **Fully Static**: Built with SvelteKit and optimized for performance. No server required.

## Tech Stack

- **Svelte 5** with SvelteKit
- **TypeScript** for type safety
- **Tailwind CSS** for modern styling
- **Vitest** for comprehensive testing
- **Vite-Node** for build-time pipelines (translation & image generation)

## Getting Started

### Prerequisites

- Node.js 24+ and npm 10+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Type Checking

```bash
npm run check
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Data Validation

```bash
# Validate story formats, context data, and schemas
npm run validate

# Validate only YAML schemas (completeness checks)
npm run validate:schemas

# Validate only context data (marker references, etc.)
npm run validate:contexts
```

The schema validation system ensures:
- All YAML files match their JSON schemas
- Translation scripts handle all place marker types
- New marker types don't break the translation pipeline
- IDE integration (VS Code, Zed) provides real-time validation

See [SCHEMA_VALIDATION.md](docs/SCHEMA_VALIDATION.md) for details.

### Building for Production

```bash
npm run build
```

The static site will be generated in the `build/` directory.

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components (organized by domain)
│   ├── data/
│   │   ├── stories/      # Story YAML files and localized versions
│   │   ├── contexts/     # V2 hierarchical places, names, and events
│   │   ├── timeline/     # Historical events data
│   │   └── actions/      # Call-to-action content
│   ├── translation/      # V2 Translation Pipeline & Core engine
│   ├── stores/           # Svelte stores (country, language, theme)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions (date, language detection)
├── routes/               # SvelteKit routes
└── app.css               # Global styles
```

## Adding New Stories

1. Create a new folder in `src/lib/data/stories/` (e.g., `neda-2022/`).
2. Add a `story.yaml` file using the **V2 Marker Format**.
3. Add any images referenced in the story to the same folder.
4. Run `npm run translate -- --story=neda-2022` to generate localized versions using AI.

### V2 Story Format Example

```yaml
id: 'neda-2022'
title: "{{person1}}'s Story"
slug: 'neda-2022'
date: '2022-06-20'
summary: 'A story adapted to your context.'
content: |
  {{person1}} was a student in {{tehran}}. 
  During a protest near {{square}}, she was shot...

markers:
  person1:
    person: 'Neda'
    gender: f
    age: 26

  tehran:
    place: 'Tehran'
    city-large: true
    capital: true

  square:
    place: 'Azadi Square'
    landmark-protest: true
    within: tehran # Links to the city above

  killed:
    casualties: 1
    killed: true
    comparable: any

sources:
  - id: ref1
    number: 1
    title: 'News Source'
    url: 'https://example.com'

images:
  - id: scene1
    src: '/image.jpg'
    alt: 'Description'
```

## Deployment

The `build/` directory contains a fully static site that can be deployed to any host (GitHub Pages, Netlify, Vercel, S3, etc.).

```bash
npm run build
```

## License

ISC

## Acknowledgments

Built with solidarity for Mahsa, Nika, and all those who stood for freedom in Iran.
Special thanks to the human rights organizations providing verified testimonies.