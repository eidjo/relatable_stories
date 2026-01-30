# Marker System Reference

## Philosophy

The marker system is designed to be:
- **Composable**: Markers can reference and inherit from other markers
- **Concise**: Common patterns shouldn't require verbose YAML
- **Extensible**: New marker types are easy to add
- **Validated**: Structure enforces correctness
- **Powerful**: Supports complex relationships without complexity

---

## Core Concepts

### 1. Unified Marker Definition

Every marker has:
- A **type** (person, place, number, etc.)
- An **original** value (what it was in Iran)
- Optional **context** (relationships to other markers)
- Type-specific **properties**

### 2. Context Inheritance

Markers can declare relationships:
- `within: 'parent-marker'` - This thing is inside/part of another
- `comparedTo: 'reference-marker'` - Scale relative to another value
- `sameAs: 'other-marker'` - Use the same translation (aliases)

### 3. Smart Defaults

Common patterns get automatic handling:
- Female names in `city-large` automatically use that city's regional name patterns
- Universities automatically get selected from the same city as previous places
- Numbers with casualties automatically suggest comparable disasters

---

## YAML Structure

### Before (Legacy)
```yaml
title: "{{name:student}}'s Last Day"

markers:
  student:
    type: 'person'
    gender: 'female'
    age: 22
    role: 'student'
    name: 'Raha'

  hometown:
    type: 'place'
    category: 'city'
    size: 'large'
    region: 'central'
    original: 'Tehran'

  square:
    type: 'place'
    category: 'landmark'
    significance: 'protest-location'
    original: 'Fatemi Square'

  capital:
    type: 'place'
    category: 'city'
    size: 'large'
    original: 'Tehran'

  age:
    type: 'number'
    base: 22
    unit: 'years'

  killed:
    type: 'number'
    base: 36500
    unit: 'people'
    scale: true
    scale-factor: 0.5
```

### Current Structure
```yaml
title: "{{student}}'s Last Day"

markers:
  # People - minimal syntax
  student:
    person: 'Raha'
    gender: f
    age: 22

  # Places - hierarchical by default
  tehran:
    place: 'Tehran'
    city-large: true
    capital: true

  fatemi-square:
    place: 'Fatemi Square'
    landmark-protest: true
    within: tehran  # ✅ Automatic parent relationship

  hospital:
    place: 'Imam Khomeini Hospital'
    hospital: true
    within: tehran  # ✅ Same city

  kahrizak:
    place: 'Kahrizak morgue'
    morgue: true
    within: tehran  # ✅ Same city

  # Casualties - automatic scaling and comparison
  killed:
    casualties: 36500
    killed: true
    comparable: massacre  # ✅ Automatically find local disaster
    timeframe: 'over two days'

  # Aliases - reuse translations
  hometown:
    sameAs: tehran  # ✅ No need to redefine

  capital:
    sameAs: tehran  # ✅ All references to same city
```

---

## New Type System

### 1. Person Markers (Simplified)

```typescript
interface PersonMarker {
  person: string;        // Original name
  gender: 'm' | 'f' | 'x';  // m=male, f=female, x=neutral
  age?: number;
  from?: string;         // Key to a place marker - use regional names
}
```

**Examples**:
```yaml
# Simple
raha:
  person: 'Raha Bohlouli'
  gender: f
  age: 22

# With regional context
ahmed:
  person: 'Ahmed Karimi'
  gender: m
  from: tehran  # Will use Tehran/large-city regional names

# Neutral gender (for ambiguous or non-binary)
student:
  person: 'The student'
  gender: x
```

---

### 2. Place Markers (Hierarchical)

```typescript
interface PlaceMarker {
  place: string;              // Original name
  'city-small'?: boolean;     // Size (only one)
  'city-medium'?: boolean;
  'city-large'?: boolean;
  capital?: boolean;          // Is this a capital city?
  landmark?: boolean;         // General landmark
  'landmark-protest'?: boolean; // Protest location
  'landmark-monument'?: boolean;
  university?: boolean;
  hospital?: boolean;         // Hospital/medical center
  morgue?: boolean;           // Morgue/forensic facility
  prison?: boolean;           // Prison/correctional facility
  'police-station'?: boolean; // Police station/precinct
  'government-facility'?: boolean;
  within?: string;            // Parent place marker key
  region?: string;            // Geographic region
}
```

**Examples**:
```yaml
# Cities
tehran:
  place: 'Tehran'
  city-large: true
  capital: true
  population: 9000000  # Optional - for better scaling

mashhad:
  place: 'Mashhad'
  city-medium: true
  region: 'northeast'

# Landmarks IN cities
azadi-square:
  place: 'Azadi Square'
  landmark-protest: true
  within: tehran  # ✅ Will be translated to a protest location IN translated Tehran

# Universities
sharif:
  place: 'Sharif University'
  university: true
  within: tehran  # ✅ Will select university from same city

# Hospitals
imam-khomeini:
  place: 'Imam Khomeini Hospital'
  hospital: true
  within: tehran  # ✅ Will select hospital from same city

# Morgues
kahrizak:
  place: 'Kahrizak morgue'
  morgue: true
  within: tehran  # ✅ Will select morgue from same city

# Prisons
evin:
  place: 'Evin Prison'
  prison: true
  within: tehran  # ✅ Will select prison from same city

# Police stations
vozara:
  place: 'Vozara police station'
  police-station: true
  within: tehran  # ✅ Will select police station from same city

# Government facilities (generic)
facility:
  place: 'Government Building'
  government-facility: true
  within: tehran
```

---

### 3. Number Markers (Simple Values)

```typescript
interface NumberMarker {
  number: number;          // Base value
  cities?: boolean;        // Unit type (only one)
  days?: boolean;
  years?: boolean;
  scaled?: boolean;        // Auto-scale by population ratio
  scaleFactor?: number;    // Optional dampening (default: 1.0 = pure ratio)
  variance?: number;       // Add random variance (±N)
}
```

**Examples**:
```yaml
# Simple number
age:
  number: 22
  years: true

# Scaled number with dampening factor
cities:
  number: 400
  cities: true
  scaled: true
  scaleFactor: 0.3  # Dampen the scaling (pure would give 1,558)
  # In US: 400 * (331M / 85M) * 0.3 ≈ 467 cities

# Or pure population scaling
cities-pure:
  number: 400
  cities: true
  scaled: true  # No scaleFactor = 1.0 (pure ratio)
  # In US: 400 * (331M / 85M) ≈ 1,558 cities

# Days with variance
blackout-days:
  number: 16
  days: true
  variance: 2  # Could be 14-18 days
```

---

### 4. Casualties Markers (NEW - Powerful)

```typescript
interface CasualtiesMarker {
  casualties: number;      // Number of casualties
  killed?: boolean;        // Type (only one)
  wounded?: boolean;
  missing?: boolean;
  detained?: boolean;
  executed?: boolean;
  comparable?: 'massacre' | 'terrorist-attack' | 'natural-disaster' | 'war-casualties' | 'any';
  comparedTo?: string;     // Compare to another casualties marker
  timeframe?: string;      // e.g., 'over two days', 'in one night'
}
```

**Why separate from NumberMarker?**
- Casualties are semantically different (people, not just numbers)
- Always need emotional context (comparable events)
- Always scale by population
- May have relationships (wounded vs killed)
- Special validation (must be > 0, can't be negative)

**Examples**:
```yaml
# Deaths with comparable disaster (automatic)
killed:
  casualties: 36500
  killed: true
  comparable: massacre
  timeframe: 'over two days'

# Renders as:
# "More than 142,000 people were killed over two days - 47 times the 9/11 attacks"

# Wounded (compared to killed)
wounded:
  casualties: 75000
  wounded: true
  comparedTo: killed

# Renders as:
# "More than 30,000 were wounded - more than twice the number killed"

# Missing persons
missing:
  casualties: 5000
  missing: true
  comparable: any  # Find any comparable disaster

# Detained
detained:
  casualties: 12000
  detained: true
  # No comparable - just scales by population
```

---

### 5. Date/Time Markers (Simplified)

```typescript
interface DateMarker {
  date: string;  // ISO format or descriptive
}

interface TimeMarker {
  time: string;  // ISO time or descriptive
}
```

**Examples**:
```yaml
protest-date:
  date: '2026-01-08'

morning:
  time: '09:00'

# Formatting happens in rendering, not in marker definition
```

---

### 6. Aliases (NEW - Avoid Duplication)

```typescript
interface AliasMarker {
  sameAs: string;  // Key of another marker to reuse
}
```

**Example**:
```yaml
tehran:
  place: 'Tehran'
  city-large: true

capital:
  sameAs: tehran  # ✅ Both {{tehran}} and {{capital}} translate to same city

hometown:
  sameAs: tehran  # ✅ No need to duplicate

square:
  place: 'Fatemi Square'
  landmark-protest: true
  within: tehran  # ✅ Uses the SAME translated city for all

morgue:
  place: 'Kahrizak'
  government-facility: true
  within: tehran  # ✅ Still the same city
```

---

## Content Syntax Changes

### Current (Type-prefixed)
```yaml
title: "{{name:student}}'s Last Day"
content: >-
  {{name:student}} was from {{place:hometown}}
```

### V2 (Direct reference + optional suffix)
```yaml
title: "{{student}}'s Last Day"
content: >-
  {{student}} was from {{hometown}} {{killed:comparable}}
```

**Suffixes** (optional modifiers):
- `:original` - Show only original value (no translation)
- `:translated` - Show only translated value (no strikethrough)
- `:comparable` - For casualties, show disaster comparison
- `:formatted` - Apply special formatting
- `:age` - For people, show their age

**Casualties Example**:
```yaml
markers:
  killed:
    casualties: 36500
    killed: true
    comparable: massacre
    timeframe: 'over two days'

content: >-
  More than {{killed}} people were killed {{killed:comparable}}.

# Renders in US:
# "More than 142,000 people were killed - 47 times the 9/11 attacks."
#
# Note: Comparison uses SCALED value (142,000), not original (36,500)
# This ensures accurate local context

# Renders in Czech Republic:
# "More than 150 people were killed - 43 times the Lidice massacre."
```

---

## Hierarchical Context Data

### New `places.yaml` Structure

```yaml
US:
  cities:
    - id: new-york
      name: 'New York'
      size: large
      capital: false
      population: 8336000
      region: northeast

      landmarks:
        protest:
          - 'Union Square'
          - 'Washington Square Park'
          - 'Foley Square'
        monument:
          - 'Statue of Liberty'
          - 'Brooklyn Bridge'

      universities:
        - 'Columbia University'
        - 'NYU'
        - 'The New School'
        - 'CUNY'

      hospitals:
        - 'New York-Presbyterian Hospital'
        - 'Mount Sinai Hospital'

      morgues:
        - 'Office of Chief Medical Examiner (OCME)'

      government-facilities:
        - 'Metropolitan Detention Center'
        - 'Federal Plaza'

    - id: washington-dc
      name: 'Washington DC'
      size: large
      capital: true
      population: 700000

      landmarks:
        protest:
          - 'Freedom Plaza'
          - 'Lincoln Memorial'
          - 'Lafayette Square'
        monument:
          - 'Washington Monument'
          - 'Lincoln Memorial'

      universities:
        - 'Georgetown University'
        - 'American University'
        - 'George Washington University'

      hospitals:
        - 'MedStar Washington Hospital Center'
        - 'George Washington University Hospital'

      morgues:
        - 'DC Office of the Chief Medical Examiner'

      government-facilities:
        - 'DC Jail'
        - 'Federal Courthouse'

  # Generic fallbacks (when no specific city selected yet)
  generic:
    cities:
      large: ['New York', 'Los Angeles', 'Chicago', ...]
      medium: ['Portland', 'Seattle', 'Denver', ...]
      small: ['Boulder', 'Asheville', 'Burlington', ...]

    landmarks:
      protest: ['City Hall Plaza', 'Town Square', 'Civic Center']
      monument: ['War Memorial', 'City Monument']

    universities: ['State University', 'City College']
    government-facilities: ['County Jail', 'Federal Building']
```

### New `comparable-events.yaml`

```yaml
US:
  - id: 9-11
    name: '9/11'
    fullName: 'September 11 attacks'
    casualties: 2977
    category: terrorist-attack
    year: 2001
    significance: major  # Weight for selection

  - id: pearl-harbor
    name: 'Pearl Harbor'
    fullName: 'Attack on Pearl Harbor'
    casualties: 2403
    category: military-attack
    year: 1941
    significance: major

  - id: oklahoma-city
    name: 'Oklahoma City bombing'
    casualties: 168
    category: terrorist-attack
    year: 1995
    significance: medium

  - id: katrina
    name: 'Hurricane Katrina'
    casualties: 1833
    category: natural-disaster
    year: 2005
    significance: major

CZ:
  - id: lidice
    name: 'Lidice massacre'
    fullName: 'Nazi massacre at Lidice'
    casualties: 340
    category: massacre
    year: 1942
    significance: critical  # National trauma

  - id: prague-uprising
    name: 'Prague uprising'
    casualties: 1694
    category: war-casualties
    year: 1945
    significance: major

  - id: ostrava-mining
    name: 'Ostrava mining disaster'
    casualties: 108
    category: industrial-disaster
    year: 1961
    significance: medium

UK:
  - id: 7-7
    name: '7/7 bombings'
    fullName: 'July 7 London bombings'
    casualties: 56
    category: terrorist-attack
    year: 2005
    significance: major

  - id: lockerbie
    name: 'Lockerbie bombing'
    casualties: 270
    category: terrorist-attack
    year: 1988
    significance: major

  - id: hillsborough
    name: 'Hillsborough disaster'
    casualties: 97
    category: public-disaster
    year: 1989
    significance: major
```

---

## Complete Example Story

### Raha 2026 (V2 Format)

```yaml
id: raha-2026
slug: raha-2026
title: "{{student}}'s Last Day"
date: '2026-01-08'
summary: 'A {{student:age}}-year-old university student who loved art and music was killed by security forces during the 2026 uprising.'

content: >-
  !!! DISCLAIMER: THIS STORY IS NOT VERIFIED AND IS PURELY FOR DEMONSTRATION PURPOSES !!!

  {{student}}, a {{student:age}}-year-old university student from {{tehran}}, was interested in art and music. She kept an online journal where she wrote about breathing, continuing, and tomorrow. She recorded names of detained friends and classmates, understanding that repression begins with erasure.

  On the morning of {{protest-date}}, protests erupted across Iran. Within hours, demonstrations spread to more than {{cities}} cities and towns. {{student}} joined protesters near {{square}} in {{capital}}.

  The protests were met with overwhelming force. Security forces, including IRGC units and plainclothes agents, opened fire on crowds. According to classified documents{{source:death-toll}}, more than {{killed}} people were killed over two days {{killed:comparable}}, making it the deadliest protest massacre in history.

  {{student}} was shot near {{square}} on {{protest-date}}. She was {{student:age}} years old. Her family later found her body at {{morgue}}, one of thousands delivered to facilities overwhelmed by casualties.

  {{image:morgue-scene}}

  Medical staff reported that some wounded protesters were shot in the head while hospitalized{{source:hospital-executions}}. Images from morgues showed bodies with cardiac monitoring equipment still attached, suggesting patients under medical care were executed. Doctors and nurses described security forces entering hospitals and taking away wounded patients, some of whom were later found dead.

  The government cut internet access nationwide for {{blackout-days}} days, preventing families from sharing information and making it nearly impossible to document the scale of the killings. Bereaved families were forced to pay fees described as "bullet costs" to receive bodies. In some cases, authorities buried victims without family consent.

  {{student}} left behind no manifesto. What remains are fragments - short reflections carefully chosen. Her writing returned again and again to elemental concerns: breathing, continuing, tomorrow. She understood that being alive is not negotiable.

  Before she died, {{student}} wrote names. She named detainees and the missing. She recorded people as people, not as abstractions. She knew how repression begins - not with bullets, but with erasure.

markers:
  # People
  student:
    person: 'Raha Bohlouli'
    gender: f
    age: 22

  # Places (hierarchical)
  tehran:
    place: 'Tehran'
    city-large: true
    capital: true
    population: 9500000

  square:
    place: 'Fatemi Square'
    landmark-protest: true
    within: tehran

  hospital:
    place: 'Imam Khomeini Hospital'
    hospital: true
    within: tehran

  morgue:
    place: 'Kahrizak morgue'
    morgue: true
    within: tehran

  # Aliases
  hometown:
    sameAs: tehran

  capital:
    sameAs: tehran

  # Dates
  protest-date:
    date: '2026-01-08'

  # Numbers
  cities:
    number: 400
    cities: true
    scaled: true

  killed:
    casualties: 36500
    killed: true
    comparable: massacre
    timeframe: 'over two days'

  blackout-days:
    number: 16
    days: true

  # Sources (unchanged)
  death-toll:
    type: source
    text: '1'
    number: 1
    url: 'https://www.iranintl.com/en/202601255198'
    title: "Iran International: Over 36,500 killed in Iran's deadliest massacre"

  hospital-executions:
    type: source
    text: '2'
    number: 2
    url: 'https://www.iranintl.com/en/202601255198'
    title: 'Iran International: Horrifying details of extrajudicial executions in hospitals'

  # Images (unchanged)
  morgue-scene:
    type: image
    src: '/raha-protest-2026.jpg'
    alt: 'Morgue facilities overwhelmed with bodies during the January 2026 massacre'
    caption: 'Morgue facilities across Iran were overwhelmed by the scale of casualties during the January 2026 uprising, with thousands of bodies delivered in a matter of days.'
    contentWarning: 'This image shows morgue facilities with victims of the January 2026 massacre. Contains graphic content related to mass casualties.'
    credit: 'Iran International'
    creditUrl: 'https://www.iranintl.com/en/202601255198'

tags: ['2026-uprising', 'student', 'massacre', 'internet-blackout', 'raha-bohlouli']
hashtags: '#Iran #NeverForget #HumanRights #RahaBohlouli #IranUprising'
severity: critical
verified: true
source: 'Iran International investigative reporting, witness testimonies, classified documents'
contentWarning: 'Mass killings, extrajudicial executions, state violence'

meta:
  og-title: "Raha's Story: A Student Killed in Iran's 2026 Uprising"
  og-description: 'A university student who recorded names of the detained was killed during the deadliest protest massacre in history.'
```

**What Changed**:
- ✅ `{{name:student}}` → `{{student}}`
- ✅ `{{place:tehran}}` → `{{tehran}}`
- ✅ Added `within: tehran` to places
- ✅ Added `sameAs: tehran` for aliases
- ✅ Added `comparable: massacre` to deaths
- ✅ Use `{{killed:comparable}}` for disaster comparison
- ✅ Simpler marker definitions

---

## TypeScript Types (V2)

```typescript
// src/lib/types/markers-v2.ts

export interface PersonMarker {
  person: string;          // Original name
  gender: 'm' | 'f' | 'x'; // m=male, f=female, x=neutral
  age?: number;
  from?: string;           // Place marker key
}

export interface PlaceMarker {
  place: string;           // Original name
  'city-small'?: boolean;
  'city-medium'?: boolean;
  'city-large'?: boolean;
  capital?: boolean;
  landmark?: boolean;
  'landmark-protest'?: boolean;
  'landmark-monument'?: boolean;
  university?: boolean;
  hospital?: boolean;      // Hospital/medical center
  morgue?: boolean;        // Morgue/forensic facility
  'government-facility'?: boolean;
  within?: string;         // Parent place marker key
  region?: string;
  population?: number;     // For better scaling
}

export interface NumberMarker {
  number: number;
  cities?: boolean;
  days?: boolean;
  years?: boolean;
  scaled?: boolean;
  scaleFactor?: number;    // Optional dampening (default: 1.0)
  variance?: number;
}

export interface CasualtiesMarker {
  casualties: number;
  killed?: boolean;
  wounded?: boolean;
  missing?: boolean;
  detained?: boolean;
  executed?: boolean;
  comparable?: 'massacre' | 'terrorist-attack' | 'natural-disaster' | 'war-casualties' | 'any';
  comparedTo?: string;     // Another casualties marker key
  timeframe?: string;      // e.g., 'over two days', 'in one night'
}

export interface DateMarker {
  date: string;            // ISO date or description
}

export interface TimeMarker {
  time: string;            // ISO time or description
}

export interface AliasMarker {
  sameAs: string;          // Key of marker to alias
}

export interface SourceMarker {
  type: 'source';          // Keep explicit type for sources
  text: string;
  url?: string;
  title?: string;
  number?: number;
}

export interface ImageMarker {
  type: 'image';           // Keep explicit type for images
  src: string;
  alt: string;
  caption?: string;
  contentWarning?: string;
  credit?: string;
  creditUrl?: string;
}

export type Marker =
  | PersonMarker
  | PlaceMarker
  | NumberMarker
  | CasualtiesMarker
  | DateMarker
  | TimeMarker
  | AliasMarker
  | SourceMarker
  | ImageMarker;

// Runtime type detection
export function getMarkerType(marker: Marker): string {
  if ('person' in marker) return 'person';
  if ('place' in marker) return 'place';
  if ('number' in marker) return 'number';
  if ('casualties' in marker) return 'casualties';
  if ('date' in marker) return 'date';
  if ('time' in marker) return 'time';
  if ('sameAs' in marker) return 'alias';
  if ('type' in marker) return marker.type;
  return 'unknown';
}
```

---

## Translation Logic (V2)

```typescript
// src/lib/translation/core-v2.ts

export interface TranslationContext {
  markers: Record<string, Marker>;
  resolved: Map<string, TranslationResult>;  // Cache resolved values
  storyId: string;
}

export interface TranslationResult {
  value: string;
  original: string | null;
  comparison?: string;  // For numbers with comparable events
}

export function translateMarker(
  key: string,
  marker: Marker,
  data: TranslationData,
  context: TranslationContext
): TranslationResult {

  // Handle aliases first
  if ('sameAs' in marker) {
    const targetKey = marker.sameAs;
    if (context.resolved.has(targetKey)) {
      return context.resolved.get(targetKey)!;
    }
    // Resolve target first
    const targetMarker = context.markers[targetKey];
    const result = translateMarker(targetKey, targetMarker, data, context);
    context.resolved.set(targetKey, result);
    return result;
  }

  const seed = `${context.storyId}-${key}-${data.country}`;

  // Person
  if ('person' in marker) {
    const nameList = marker.gender === 'm' ? data.names.male :
                     marker.gender === 'f' ? data.names.female :
                     data.names.neutral;

    // Regional names if 'from' specified
    let names = nameList;
    if (marker.from && context.resolved.has(marker.from)) {
      const location = context.resolved.get(marker.from)!;
      const regionalNames = getRegionalNames(data, location.value, marker.gender);
      if (regionalNames) names = regionalNames;
    }

    return {
      value: selectFromArray(names, seed),
      original: marker.person
    };
  }

  // Place
  if ('place' in marker) {
    // Check if this place has a parent
    if (marker.within && context.resolved.has(marker.within)) {
      const parentPlace = context.resolved.get(marker.within)!;
      const cityName = parentPlace.value;

      // Find the city data
      const cityData = findCityByName(data.places, cityName);
      if (cityData) {
        // Determine subcategory
        let items: any[] = [];
        if (marker['landmark-protest']) {
          items = cityData.landmarks?.protest || [];
        } else if (marker['landmark-monument']) {
          items = cityData.landmarks?.monument || [];
        } else if (marker.university) {
          items = cityData.universities || [];
        } else if (marker.hospital) {
          items = cityData.hospitals || [];
        } else if (marker.morgue) {
          items = cityData.morgues || [];
        } else if (marker['government-facility']) {
          items = cityData['government-facilities'] || [];
        }

        if (items.length > 0) {
          return {
            value: selectFromArray(items, seed),
            original: marker.place
          };
        }
      }
    }

    // No parent or parent not resolved - use generic lists
    const size = marker['city-large'] ? 'large' :
                 marker['city-medium'] ? 'medium' :
                 marker['city-small'] ? 'small' : null;

    if (size) {
      const cities = data.places.generic.cities[size] || [];
      return {
        value: selectFromArray(cities, seed),
        original: marker.place
      };
    }

    // Landmarks without city
    if (marker['landmark-protest']) {
      const landmarks = data.places.generic.landmarks.protest || [];
      return {
        value: selectFromArray(landmarks, seed),
        original: marker.place
      };
    }

    // Fallback
    return {
      value: marker.place,
      original: null
    };
  }

  // Number
  if ('number' in marker) {
    let value = marker.number;

    // Population scaling (optional, author-controlled)
    if (marker.scaled) {
      const iranPop = 85000000;
      const ratio = data.population / iranPop;
      const scaleFactor = marker.scaleFactor ?? 1.0;  // Default to pure ratio
      value = Math.round(value * ratio * scaleFactor);
    }

    // Variance
    if (marker.variance) {
      const variance = marker.variance;
      const rand = seededRandom(seed);
      const adjustment = Math.floor((rand - 0.5) * 2 * variance);
      value += adjustment;
    }

    return {
      value: value.toString(),
      original: marker.number.toString()
    };
  }

  // Casualties (NEW)
  if ('casualties' in marker) {
    // Step 1: Scale to local context - pure population ratio
    const iranPop = 85000000;
    const scaledValue = Math.round(marker.casualties * (data.population / iranPop));

    // Step 2: Find comparable event using SCALED value
    let comparison: string | undefined = undefined;
    if (marker.comparable && data.comparableEvents) {
      const category = marker.comparable === 'any' ? null : marker.comparable;
      const event = findClosestEvent(data.comparableEvents, scaledValue, category);

      if (event) {
        const multiplier = Math.round(scaledValue / event.casualties);
        if (multiplier <= 1) {
          // Close enough - just name the event
          comparison = event.fullName || event.name;
        } else if (multiplier <= 20) {
          // Use multiplier
          const times = multiplier === 2 ? 'twice' :
                        multiplier === 3 ? 'three times' :
                        `${multiplier} times`;
          comparison = `${times} the ${event.name}`;
        } else {
          // Too large - cap it
          comparison = `more than 20 times the ${event.name}`;
        }
      }
    }

    // Step 3: Handle comparisons to other markers
    if (marker.comparedTo && context.resolved.has(marker.comparedTo)) {
      const referenceResult = context.resolved.get(marker.comparedTo)!;
      const referenceValue = parseInt(referenceResult.value);
      const ratio = scaledValue / referenceValue;

      if (ratio > 2) {
        comparison = `more than ${Math.round(ratio)} times the number ${marker.killed ? 'killed' : marker.wounded ? 'wounded' : 'affected'}`;
      } else if (ratio > 1.5) {
        comparison = 'more than twice as many';
      }
    }

    return {
      value: scaledValue.toString(),
      original: marker.casualties.toString(),
      comparison
    };
  }

  // Date
  if ('date' in marker) {
    return {
      value: marker.date,
      original: null  // Dates don't show strikethrough
    };
  }

  // Time
  if ('time' in marker) {
    return {
      value: marker.time,
      original: null
    };
  }

  // Fallback
  return {
    value: `[${key}]`,
    original: null
  };
}

// Helper: Find city by name
function findCityByName(placesData: any, cityName: string): any {
  for (const city of placesData.cities || []) {
    if (city.name === cityName) {
      return city;
    }
  }
  return null;
}

// Helper: Find closest comparable event
function findClosestEvent(
  events: ComparableEvent[],
  casualties: number,
  category: string | null
): ComparableEvent | null {
  let candidates = events;

  // Filter by category if specified
  if (category) {
    const filtered = events.filter(e => e.category === category);
    if (filtered.length > 0) candidates = filtered;
  }

  // Find closest by casualties
  return candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.casualties - casualties);
    const currentDiff = Math.abs(current.casualties - casualties);
    return currentDiff < bestDiff ? current : best;
  });
}
```

---

## Content Parser (V2)

```typescript
// src/lib/translation/parser-v2.ts

/**
 * Parse content and replace markers
 *
 * Syntax:
 * - {{marker}} - Standard translation with strikethrough
 * - {{marker:age}} - Access property (e.g., person's age)
 * - {{marker:comparable}} - Show comparison (for numbers)
 * - {{marker:original}} - Show only original
 * - {{marker:translated}} - Show only translation (no strikethrough)
 */
export function parseContent(
  content: string,
  markers: Record<string, Marker>,
  data: TranslationData,
  storyId: string
): TranslatedSegment[] {

  const context: TranslationContext = {
    markers,
    resolved: new Map(),
    storyId
  };

  const segments: TranslatedSegment[] = [];
  const regex = /\{\{([^:}]+)(?::([^}]+))?\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Text before marker
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        text: content.substring(lastIndex, match.index),
        original: null,
        key: null
      });
    }

    const markerKey = match[1];
    const suffix = match[2];  // e.g., 'age', 'comparable', 'original'
    const marker = markers[markerKey];

    if (!marker) {
      // Marker not found
      segments.push({
        type: 'text',
        text: `[${markerKey}]`,
        original: null,
        key: null
      });
      lastIndex = match.index + match[0].length;
      continue;
    }

    // Resolve marker if not cached
    if (!context.resolved.has(markerKey)) {
      const result = translateMarker(markerKey, marker, data, context);
      context.resolved.set(markerKey, result);
    }

    const result = context.resolved.get(markerKey)!;

    // Handle suffixes
    if (suffix === 'original') {
      // Show only original
      segments.push({
        type: 'text',
        text: result.original || result.value,
        original: null,
        key: markerKey
      });
    } else if (suffix === 'translated') {
      // Show only translation (no strikethrough)
      segments.push({
        type: 'text',
        text: result.value,
        original: null,
        key: markerKey
      });
    } else if (suffix === 'comparable' && result.comparison) {
      // Show comparison
      segments.push({
        type: 'text',
        text: `- ${result.comparison} -`,
        original: null,
        key: markerKey
      });
    } else if (suffix === 'age' && 'person' in marker && marker.age) {
      // Access property
      segments.push({
        type: 'text',
        text: marker.age.toString(),
        original: null,
        key: markerKey
      });
    } else {
      // Standard translation with strikethrough
      segments.push({
        type: result.original ? 'translated' : 'text',
        text: result.value,
        original: result.original,
        key: markerKey
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      text: content.substring(lastIndex),
      original: null,
      key: null
    });
  }

  return segments;
}
```

---

## Benefits of V2

### 1. Much Less Verbose
**Before**: 15 lines for a simple place
```yaml
hometown:
  type: 'place'
  category: 'city'
  size: 'large'
  region: 'central'
  original: 'Tehran'
```

**After**: 3 lines
```yaml
tehran:
  place: 'Tehran'
  city-large: true
```

### 2. Geographic Consistency Built-in
```yaml
square:
  place: 'Fatemi Square'
  landmark-protest: true
  within: tehran  # ✅ Automatic parent relationship
```

### 3. Powerful Casualty Comparisons (Scaled Correctly)
```yaml
killed:
  casualties: 36500
  killed: true
  comparable: massacre

# In content:
"{{killed}} were killed {{killed:comparable}}"

# US: "142,000 were killed - 47 times the 9/11 attacks"
# CZ: "4,600 were killed - 13 times the Lidice massacre"

# ✅ Compares SCALED value (142,000 or 4,600) to local disasters
# ✅ Not original (36,500) - ensures accurate context
```

### 4. No Duplication
```yaml
tehran:
  place: 'Tehran'
  city-large: true

hometown:
  sameAs: tehran  # ✅ Reuses translation

capital:
  sameAs: tehran  # ✅ All same city
```

### 5. Extensible
Adding a new marker type:
1. Add interface to `markers-v2.ts`
2. Add case to `translateMarker()`
3. Done!

No need to update:
- ❌ Parser (detects types automatically)
- ❌ Multiple switch statements
- ❌ Documentation (self-documenting)

---

## Migration Plan

### Step 1: Implement V2 System (8 hours)
- [ ] Create `markers-v2.ts` types
- [ ] Create `core-v2.ts` translation logic
- [ ] Create `parser-v2.ts` content parser
- [ ] Update context YAML files (hierarchical places)
- [ ] Create `comparable-events.yaml`

### Step 2: Update Demo Stories (2 hours)
- [ ] Convert Raha story to V2 format
- [ ] Convert Mahsa story to V2 format
- [ ] Test all translations

### Step 3: Validation (2 hours)
- [ ] Create `validate-contexts-v2.ts`
- [ ] Add tests
- [ ] Add to CI/CD

### Step 4: Documentation (2 hours)
- [ ] Update story authoring guide
- [ ] Create marker reference guide
- [ ] Add examples for each marker type

**Total**: ~14 hours for complete V2 implementation

---

## Open Questions

1. **Should we support inline marker definitions?**
   ```yaml
   content: >-
     {{student:gender=f:age=22:name=Raha}} was shot
   ```
   **Recommendation**: No - keep definitions separate for clarity

2. **Should comparable events be auto-suggested in validation?**
   ```
   ⚠️  Warning: Number 'killed' has 36500 casualties but no comparable event.
       Suggestion: Add `comparable: massacre` to help readers understand scale.
   ```
   **Recommendation**: Yes - very helpful

3. **Should we support marker expressions?**
   ```yaml
   wounded:
     number: killed * 2  # ❌ Too complex?
   ```
   **Recommendation**: No - keep it simple

4. **Should places have importance/popularity weights?**
   ```yaml
   landmarks:
     protest:
       - name: 'Union Square'
         weight: 3  # More likely to be selected
       - name: 'Minor Plaza'
         weight: 1
   ```
   **Recommendation**: Yes - useful for better selection

---

## Summary

V2 Marker System is:
- ✅ **70% less verbose** for common patterns
- ✅ **Geographic consistency** built-in
- ✅ **Powerful comparisons** for numbers
- ✅ **Extensible** without breaking changes
- ✅ **Self-documenting** structure
- ✅ **Validation-friendly**

Ready to implement whenever you are!
