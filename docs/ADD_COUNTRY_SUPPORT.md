# Adding Country Support

This guide explains how to add support for a new country to the Relatable Stories application. When adding a country, the goal is to create accurate cultural and demographic approximations that make Iranian stories feel locally relevant.

## Overview

Adding a country requires:
1. Country metadata (population, currency, timezone)
2. Language configuration
3. Date locale support
4. Name translations (by gender)
5. Place translations (hierarchical city structure)
6. Comparable events (1-3 significant historical events)

## Step-by-Step Guide

### 1. Add Country Metadata

**File**: `src/lib/data/contexts/countries.yaml`

Add a new entry to the `countries` array:

```yaml
- code: 'XX'                    # ISO 3166-1 alpha-2 code
  name: 'Country Name'
  population: 00000000          # Current population (approximate)
  currency: 'XXX'               # ISO 4217 currency code
  currency-symbol: '¤'          # Currency symbol used locally
  rial-to-local: 0.000000       # Conversion rate from Iranian Rial
  timezones:
    - 'Region/City'             # IANA timezone(s)
```

#### How to Find Accurate Values

**Population**:
- Source: World Bank, CIA World Factbook, or national statistics agencies
- Use most recent available data
- Use exact numbers (not rounded)

**Currency Conversion Rate** (`rial-to-local`):
- Calculate: 1 IRR = X local currency
- Use current exchange rates from reliable sources (xe.com, OANDA)
- Formula: `rial-to-local = 1 / (IRR per 1 local currency)`
- Example: If 1 USD = 42,000 IRR, then `rial-to-local = 1 / 42000 = 0.0000238`
- Round to 6 decimal places

**Timezones**:
- Use IANA timezone database format
- Include all major timezones for the country
- Example: `'Europe/Bucharest'`, `'America/New_York'`

**Example**:
```yaml
- code: 'RO'
  name: 'Romania'
  population: 19050000
  currency: 'RON'
  currency-symbol: 'lei'
  rial-to-local: 0.000114
  timezones:
    - 'Europe/Bucharest'
```

### 2. Add Language Configuration

**File**: `src/lib/data/contexts/country-languages.yaml`

Add the country to the `countries` section and add the language name to `language_names`:

```yaml
countries:
  # ... existing countries
  XX:
    languages: ['xx']  # ISO 639-1 language code(s)

language_names:
  # ... existing languages
  xx: 'Language Name'  # Native name of the language
```

**Example**:
```yaml
countries:
  RO:
    languages: ['ro']

language_names:
  ro: 'Română'
```

### 3. Add Date Locale Support

**File**: `src/lib/utils/dateLocales.ts`

Import the locale from date-fns and add it to the locale map:

```typescript
// Add to imports
import { xx } from 'date-fns/locale/xx';

// Add to localeMap
const localeMap: Record<string, Locale> = {
  // ... existing locales
  xx: xx,
};
```

**Example**:
```typescript
import { ro } from 'date-fns/locale/ro';

const localeMap: Record<string, Locale> = {
  // ... existing
  ro: ro,
};
```

### 4. Add Name Translations

**File**: `src/lib/data/contexts/names.yaml`

Add translations for male, female, and neutral names:

```yaml
XX:
  female:
    - [10 popular female first names]
  male:
    - [10 popular male first names]
  neutral:
    - [10 unisex/neutral names]
```

#### Selecting Appropriate Names

**Criteria**:
- Use currently popular names (check recent birth registries)
- Choose names that are culturally mainstream
- Avoid names with strong political/religious associations
- Mix traditional and modern names
- Prioritize names that feel natural to native speakers

**Sources**:
- National statistics offices (birth registries)
- Government baby name databases
- Recent census data
- Cultural research sites

**Example**:
```yaml
RO:
  female:
    [
      'Maria',
      'Elena',
      'Ana',
      'Ioana',
      'Alexandra',
      'Andreea',
      'Cristina',
      'Mihaela',
      'Gabriela',
      'Diana',
    ]
  male:
    [
      'Ion',
      'Andrei',
      'Alexandru',
      'Mihai',
      'Gheorghe',
      'Constantin',
      'Ștefan',
      'Nicolae',
      'Vasile',
      'Cristian',
    ]
  neutral: ['Alex', 'Andrea', 'Mihai', 'Sasha', 'Niki', 'Dan', 'Adrian', 'Bogdan', 'Cristi', 'Radu']
```

### 5. Add Place Translations (V2 Hierarchical Structure)

**File**: `src/lib/data/contexts/places.yaml`

Add location mappings using the hierarchical city structure. Each city contains its own landmarks, universities, and government facilities:

```yaml
XX:
  cities:
    - id: city-id              # Kebab-case identifier
      name: 'City Name'
      size: large              # small, medium, or large
      capital: true            # true or false
      population: 000000       # City population
      region: region-name      # Geographic region
      landmarks:
        protest:               # Public gathering spaces
          - 'Square/Park Name'
        monument:              # Cultural landmarks
          - 'Monument Name'
      universities:
        - 'University Name'
      government-facilities:
        - 'Facility Type'      # Generic names, not specific buildings
      hospitals:
        - 'Hospital Name'      # Real hospital names in local language
      morgues:
        - 'Morgue/Medical Examiner Name'  # Real facility names
```

#### City Size Guidelines

**Small Cities** (population: 50,000-200,000):
- Regional centers
- Recognizable locally

**Medium Cities** (population: 200,000-1,000,000):
- Major regional hubs
- Mix of industrial, academic, cultural centers

**Large Cities** (population: 1,000,000+):
- Major metropolitan areas
- International recognition

#### Landmark Selection

**Protest Landmarks**:
- Historic public squares
- Government building plazas
- University squares
- Parks with symbolic significance
- Places known for public gatherings
- Avoid: Commercial centers, religious sites

**Monument Landmarks**:
- Well-known cultural sites
- Historical monuments
- Architectural landmarks

#### Universities

- Mix of public and private institutions
- Nationally recognized
- Geographically diverse
- Various specializations

#### Government Facilities

- Use generic institutional names
- Examples: "District Detention Center", "Municipal Police Station"
- Avoid: Actual facility names that could be identified

#### Hospitals

- Use real, well-known hospital names in the local language
- Include major public hospitals and medical centers
- 2 hospitals per city is typical
- Examples: "City General Hospital", "University Medical Center"

#### Morgues

- Use real forensic/medical examiner facility names
- Include institutes of forensic medicine, public mortuaries
- 1-2 morgues per city is typical
- Examples: "Institute of Forensic Medicine", "City Mortuary"

**Example**:
```yaml
RO:
  cities:
    - id: bucharest
      name: 'Bucharest'
      size: large
      capital: true
      population: 1883000
      region: muntenia
      landmarks:
        protest:
          - 'Piața Universității'
          - 'Piața Victoriei'
          - 'Piața Revoluției'
        monument:
          - 'Palace of Parliament'
          - 'Arcul de Triumf'
      universities:
        - 'University of Bucharest'
        - 'Politehnica University of Bucharest'
        - 'Academy of Economic Studies'
      government-facilities:
        - 'Rahova Prison'
        - 'Bucharest Court'
      hospitals:
        - 'Spitalul Universitar de Urgență București'
        - 'Spitalul Clinic Colentina'
      morgues:
        - 'Institutul National de Medicina Legala "Mina Minovici"'

    - id: cluj-napoca
      name: 'Cluj-Napoca'
      size: large
      capital: false
      population: 324000
      region: transylvania
      landmarks:
        protest:
          - 'Piața Unirii'
          - 'Piața Avram Iancu'
        monument:
          - "St. Michael's Church"
          - 'Banffy Palace'
      universities:
        - 'Babeș-Bolyai University'
        - 'Technical University of Cluj-Napoca'
      government-facilities:
        - 'Cluj Prison'
        - 'Cluj Court'
      hospitals:
        - 'Spitalul Clinic Județean de Urgență Cluj'
      morgues:
        - 'Institutul de Medicina Legala Cluj-Napoca'
```

**Important**: Add 3-5 cities per country for geographic diversity.

### 6. Add Comparable Events

**File**: `src/lib/data/contexts/comparable-events.yaml`

Add 1-3 historically significant events that are relevant to today's society. These events provide emotional context for casualty numbers by comparing them to tragedies the local population can relate to.

```yaml
XX:
  # Category Comment (e.g., Political Violence, Public Disasters)
  - id: event-id                    # Kebab-case identifier
    name: 'Short name'              # Brief name for comparison text
    fullName: 'Full descriptive name'
    casualties: 000                 # Number of deaths
    category: event-category        # See categories below
    year: 0000                      # When it occurred
    significance: critical          # critical or major
```

#### Event Categories

- `protest-violence`: Deaths during protests or revolutions
- `terrorist-attack`: Terrorist incidents
- `massacre`: Mass killings
- `public-disaster`: Fires, building collapses, accidents
- `natural-disaster`: Earthquakes, floods, wildfires
- `military-attack`: War-related attacks

#### Selection Criteria

**Select events that**:
- Are widely known and remembered in the country
- Have strong emotional resonance with current population
- Are appropriate for comparison to protest casualties
- Occurred within living memory (prefer post-1950)
- Are culturally sensitive and respectful

**Prefer**:
- Recent events (last 20-30 years) for stronger connection
- Events that led to social/political change
- Tragedies that unified the nation
- Events commemorated annually

**Avoid**:
- Partisan political events
- Events with ongoing controversy
- Extremely sensitive topics without clear resolution
- Events from distant past (unless truly significant)

**Limit**:
- Add **up to 3 events** per country
- Focus on quality over quantity
- Choose events at different casualty scales for better comparison range

**Example**:
```yaml
RO:
  # Political Violence / Protests
  - id: romanian-revolution
    name: '1989 Revolution'
    fullName: 'Romanian Revolution'
    casualties: 1104
    category: protest-violence
    year: 1989
    significance: critical

  # Public Disasters
  - id: colectiv-fire
    name: 'Colectiv nightclub fire'
    fullName: 'Colectiv nightclub fire'
    casualties: 64
    category: public-disaster
    year: 2015
    significance: critical
```

### 7. Validation

After adding the country data, validate the implementation:

#### Run Tests
```bash
npm test
```

All tests should pass. The test suite validates:
- YAML syntax
- Data structure consistency
- Required fields presence

#### Type Check
```bash
npm run check
```

Should complete with 0 errors.

#### Manual Testing
```bash
npm run dev
```

1. Select the new country from the country selector
2. Navigate to a story
3. Verify:
   - Names are translated appropriately
   - Places are culturally relevant
   - Currency conversions are accurate
   - Numbers scale proportionally (when applicable)
   - Dates are formatted correctly for the language

### 8. Quality Checklist

Before submitting country support:

- [ ] Population data is current (within 2 years)
- [ ] Currency conversion rate is accurate (within last 6 months)
- [ ] Timezone(s) are correct
- [ ] Language code and name are accurate
- [ ] Date locale is imported and configured
- [ ] All name lists contain 10 entries per gender category
- [ ] Names are culturally appropriate and currently popular
- [ ] At least 3-5 cities are defined
- [ ] Each city has the correct size classification
- [ ] Capital city is marked correctly
- [ ] Protest landmarks are public gathering spaces
- [ ] Government facilities use generic institutional names
- [ ] Universities are nationally recognized
- [ ] Hospitals are real, well-known facilities (2 per city)
- [ ] Morgues are real forensic/medical examiner facilities (1-2 per city)
- [ ] 1-3 comparable events are defined
- [ ] Comparable events are culturally appropriate and well-known
- [ ] Event casualty counts are accurate
- [ ] All YAML syntax is valid (check for apostrophes in strings)
- [ ] Manual testing shows contextually appropriate translations

## Cultural Sensitivity Guidelines

When selecting names and places:

1. **Avoid Stereotypes**: Don't use names or places that reinforce cultural stereotypes
2. **Political Neutrality**: Avoid locations associated with specific political movements
3. **Religious Sensitivity**: Use secular public spaces for protest locations
4. **Geographic Diversity**: Represent different regions of the country
5. **Accessibility**: Choose locations accessible to the general public
6. **Contemporary Relevance**: Use current, recognizable names and places

## Population Scaling

The translation system automatically scales protest numbers based on population ratios:

```
scaled_value = base_value × (target_population / iran_population) × scale_factor
```

Where:
- `base_value`: Original number from Iranian story
- `target_population`: New country's population
- `iran_population`: ~85,000,000 (Iran's population)
- `scale_factor`: Defined per marker (usually 0.3-1.0)

This means:
- Larger countries will see proportionally larger numbers
- Smaller countries will see proportionally smaller numbers
- The relative scale of events is preserved

## Common YAML Pitfalls

**Apostrophes in strings**:
```yaml
# ❌ Wrong - causes YAML parse error
- 'St. Michael's Church'

# ✅ Correct - use double quotes
- "St. Michael's Church"

# ✅ Also correct - escape the apostrophe
- 'St. Michael''s Church'
```

**Indentation**:
- Use 2 spaces per indentation level
- Never use tabs
- Be consistent throughout the file

## Complete Example: Romania

Here's the complete implementation for Romania:

**countries.yaml**:
```yaml
- code: 'RO'
  name: 'Romania'
  population: 19050000
  currency: 'RON'
  currency-symbol: 'lei'
  rial-to-local: 0.000114
  timezones:
    - 'Europe/Bucharest'
```

**country-languages.yaml**:
```yaml
countries:
  RO:
    languages: ['ro']

language_names:
  ro: 'Română'
```

**dateLocales.ts**:
```typescript
import { ro } from 'date-fns/locale/ro';

const localeMap: Record<string, Locale> = {
  // ... existing
  ro: ro,
};
```

**names.yaml**:
```yaml
RO:
  female:
    [
      'Maria',
      'Elena',
      'Ana',
      'Ioana',
      'Alexandra',
      'Andreea',
      'Cristina',
      'Mihaela',
      'Gabriela',
      'Diana',
    ]
  male:
    [
      'Ion',
      'Andrei',
      'Alexandru',
      'Mihai',
      'Gheorghe',
      'Constantin',
      'Ștefan',
      'Nicolae',
      'Vasile',
      'Cristian',
    ]
  neutral: ['Alex', 'Andrea', 'Mihai', 'Sasha', 'Niki', 'Dan', 'Adrian', 'Bogdan', 'Cristi', 'Radu']
```

**places.yaml**:
```yaml
RO:
  cities:
    - id: bucharest
      name: 'Bucharest'
      size: large
      capital: true
      population: 1883000
      region: muntenia
      landmarks:
        protest:
          - 'Piața Universității'
          - 'Piața Victoriei'
          - 'Piața Revoluției'
        monument:
          - 'Palace of Parliament'
          - 'Arcul de Triumf'
      universities:
        - 'University of Bucharest'
        - 'Politehnica University of Bucharest'
        - 'Academy of Economic Studies'
      government-facilities:
        - 'Rahova Prison'
        - 'Bucharest Court'

    - id: cluj-napoca
      name: 'Cluj-Napoca'
      size: large
      capital: false
      population: 324000
      region: transylvania
      landmarks:
        protest:
          - 'Piața Unirii'
          - 'Piața Avram Iancu'
        monument:
          - "St. Michael's Church"
          - 'Banffy Palace'
      universities:
        - 'Babeș-Bolyai University'
        - 'Technical University of Cluj-Napoca'
      government-facilities:
        - 'Cluj Prison'
        - 'Cluj Court'
      hospitals:
        - 'Spitalul Clinic Județean de Urgență Cluj'
      morgues:
        - 'Institutul de Medicina Legala Cluj-Napoca'

    - id: timisoara
      name: 'Timișoara'
      size: large
      capital: false
      population: 319000
      region: banat
      landmarks:
        protest:
          - 'Piața Victoriei'
          - 'Piața Operei'
          - 'Piața Libertății'
        monument:
          - 'Victory Square'
          - 'Metropolitan Cathedral'
      universities:
        - 'West University of Timișoara'
        - 'Politehnica University of Timișoara'
      government-facilities:
        - 'Timișoara Prison'
        - 'Timișoara Court'
      hospitals:
        - 'Spitalul Clinic Județean de Urgență "Pius Brânzeu"'
      morgues:
        - 'Institutul de Medicina Legala Timișoara'

    - id: iasi
      name: 'Iași'
      size: large
      capital: false
      population: 290000
      region: moldova
      landmarks:
        protest:
          - 'Piața Unirii'
          - 'Copou Park'
        monument:
          - 'Palace of Culture'
          - 'Three Hierarchs Monastery'
      universities:
        - 'Alexandru Ioan Cuza University'
        - 'Gheorghe Asachi Technical University'
      government-facilities:
        - 'Iași Prison'
        - 'Iași Court'
      hospitals:
        - 'Spitalul Clinic Județean de Urgență "Sf. Spiridon"'
      morgues:
        - 'Institutul de Medicina Legala Iași'
```

**comparable-events.yaml**:
```yaml
RO:
  # Political Violence / Protests
  - id: romanian-revolution
    name: '1989 Revolution'
    fullName: 'Romanian Revolution'
    casualties: 1104
    category: protest-violence
    year: 1989
    significance: critical

  # Public Disasters
  - id: colectiv-fire
    name: 'Colectiv nightclub fire'
    fullName: 'Colectiv nightclub fire'
    casualties: 64
    category: public-disaster
    year: 2015
    significance: critical
```

## Getting Help

If you're unsure about any aspect:

1. Look at existing country examples in the YAML files
2. Consult cultural experts or native speakers when possible
3. Use government and academic sources for data accuracy
4. Test thoroughly before committing

## Maintenance

Country data should be reviewed periodically:

- **Currency rates**: Update every 6-12 months
- **Population**: Update with new census/estimate data
- **Names**: Review every 2-3 years for cultural trends
- **Places**: Update if major events change significance

---

By following this guide, you'll ensure new countries have accurate, culturally appropriate, and contextually relevant translations that help readers understand the human cost of repression in Iran.
