# Relatable Stories

A web application that translates stories from Iran's 2022 uprising into your local context, helping you understand and empathize with the human cost of repression.

## Features

- **Contextual Translation**: Stories are adapted to use familiar names, places, and scaled numbers based on your country
- **Interactive Tooltips**: Hover over any translated text to see the original Iranian details
- **Country Selection**: Automatically detects your country or lets you choose from 10+ supported countries
- **Fully Static**: No server required, deployable to GitHub Pages or any static host
- **Privacy-First**: No tracking, no data collection beyond country preference in localStorage
- **Accessible**: WCAG AA compliant with keyboard navigation and screen reader support

## Tech Stack

- **SvelteKit** with TypeScript
- **Tailwind CSS** for styling
- **Vitest** for testing
- **Static export** via `@sveltejs/adapter-static`

## Getting Started

### Prerequisites

- Node.js 20+ and npm

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
# Run tests once
npm test

# Watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
```

The static site will be generated in the `build/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte components
│   │   ├── layout/       # Header, Footer
│   │   ├── story/        # Story cards and detail views
│   │   ├── context/      # Country selector
│   │   ├── action/       # Call-to-action components
│   │   └── shared/       # Reusable UI components
│   ├── data/
│   │   ├── stories/      # Story YAML files (organized by folder)
│   │   ├── contexts/     # Country, name, and place mappings
│   │   ├── timeline/     # Timeline events
│   │   └── actions/      # Call-to-action content
│   ├── translation/      # Translation engine
│   ├── stores/           # Svelte stores (country selection)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── routes/               # SvelteKit routes
│   ├── +layout.svelte    # Root layout
│   ├── +page.svelte      # Home page
│   ├── stories/          # Stories list and detail pages
│   ├── about/            # About page
│   └── take-action/      # Call-to-action page
└── app.css               # Global styles + Tailwind imports
```

## Adding New Stories

1. Create a new folder in `src/lib/data/stories/` (e.g., `my-story/`)
2. Add a `story.yaml` file with the story content and marker definitions
3. Add any images to the same folder
4. Import the story YAML in `src/lib/data/stories/index.ts`

### Story YAML Format

```yaml
id: 'unique-id'
title: "{{name:person1}}'s Story"
slug: 'url-slug'
date: '2022-09-20'
summary: 'Brief summary with {{markers}}'
content: |
  Full story content with {{name:person1}}, {{place:city}}, 
  {{number:count}}, {{currency:amount}}, etc.

markers:
  person1:
    type: 'person'
    gender: 'female' # male, female, or neutral
    age: 23
    role: 'protester'

  city:
    type: 'place'
    category: 'city'
    size: 'medium' # small, medium, or large

  count:
    type: 'number'
    base: 50
    unit: 'people'
    scale: true # Scale by population
    scale-factor: 0.5

  amount:
    type: 'currency'
    base: 50000000 # Iranian Rial
    base-currency: 'IRR'

tags: ['tag1', 'tag2']
severity: 'high' # low, medium, high, or critical
verified: true
source: 'Human rights organization name'
content-warning: 'Optional warning text'
```

## Adding New Countries

Add country data to these files:

1. `src/lib/data/contexts/countries.yaml` - Country metadata
2. `src/lib/data/contexts/names.yaml` - Common names by gender
3. `src/lib/data/contexts/places.yaml` - Cities, landmarks, facilities

## Testing

The project includes comprehensive tests:

- **Story validation**: Ensures all YAML files parse correctly and have valid marker definitions
- **Translation engine**: Tests marker replacement, currency conversion, number scaling
- **Type safety**: TypeScript strict mode with full type coverage

Run `npm test` to execute all tests.

## Deployment

### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Push to `main` branch
3. GitHub Actions will automatically build and deploy (see `.github/workflows/deploy.yml`)

### GCP Storage

```bash
npm run build
gsutil -m rsync -r -d build/ gs://your-bucket-name/
```

### Other Static Hosts

The `build/` directory contains a fully static site that can be deployed to:

- Netlify
- Vercel
- Cloudflare Pages
- Any static file server

## License

ISC

## Acknowledgments

Built with solidarity for Mahsa, Nika, and all those who stood for freedom.

Stories based on verified testimonies from:

- Amnesty International
- Human Rights Watch
- Iran Human Rights
- Center for Human Rights in Iran
