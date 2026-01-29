export type MarkerType =
  | 'person'
  | 'place'
  | 'date'
  | 'time'
  | 'number'
  | 'currency'
  | 'event'
  | 'occupation'
  | 'subject'
  | 'source'
  | 'image';

export type Gender = 'male' | 'female' | 'neutral';

export interface PersonMarker {
  type: 'person';
  gender: Gender;
  age?: number;
  role?: string;
  relationship?: string;
  name?: string; // Original Iranian name
  original?: string; // Explicit original value for tooltip
}

export interface PlaceMarker {
  type: 'place';
  category: 'city' | 'landmark' | 'government-facility' | 'university';
  size?: 'small' | 'medium' | 'large';
  region?: string;
  significance?: string;
  accessibility?: string;
  'type-specific'?: string;
  prestige?: string;
  original?: string; // Original Iranian place name
}

export interface DateMarker {
  type: 'date';
  value: string;
}

export interface TimeMarker {
  type: 'time';
  value: string;
}

export interface NumberMarker {
  type: 'number';
  base: number;
  unit: string;
  scale?: boolean;
  'scale-factor'?: number;
  variance?: number;
}

export interface CurrencyMarker {
  type: 'currency';
  base: number;
  'base-currency': string;
  period?: 'monthly' | 'yearly' | 'one-time';
}

export interface EventMarker {
  type: 'event';
  value: string;
  translation?: string;
}

export interface OccupationMarker {
  type: 'occupation';
  category: string;
  subcategory?: string;
  original?: string; // Original Iranian occupation
  examples?: string[]; // List of equivalent occupations for translation
}

export interface SubjectMarker {
  type: 'subject';
  category: string;
  examples?: string[];
}

export interface SourceMarker {
  type: 'source';
  text: string; // The citation text to display
  url?: string; // Optional link to source
  title?: string; // Title/description for tooltip
  number?: number; // Optional reference number like [1]
}

export interface ImageMarker {
  type: 'image';
  src: string; // Image path or URL
  alt: string; // Alt text for accessibility
  caption?: string; // Optional caption
  contentWarning?: string; // Optional content warning
  credit?: string; // Photo credit
  creditUrl?: string; // Optional URL for photo credit
}

export type Marker =
  | PersonMarker
  | PlaceMarker
  | DateMarker
  | TimeMarker
  | NumberMarker
  | CurrencyMarker
  | EventMarker
  | OccupationMarker
  | SubjectMarker
  | SourceMarker
  | ImageMarker;

export interface StoryMeta {
  'og-title'?: string;
  'og-description'?: string;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  date: string;
  summary: string;
  content: string;
  markers: Record<string, Marker>;
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  source?: string;
  'content-warning'?: string;
  image?: string;
  meta?: StoryMeta;
}

export interface TranslatedSegment {
  text: string;
  original: string | null;
  type: MarkerType | null;
  key: string | null;
  url?: string; // For source markers
  title?: string; // For source markers and images
  // Image-specific fields
  src?: string; // Image source
  alt?: string; // Alt text
  caption?: string; // Caption
  contentWarning?: string; // Content warning
  credit?: string; // Photo credit
  creditUrl?: string; // URL for photo credit
}

export interface TranslatedStory {
  id: string;
  title: TranslatedSegment[];
  slug: string;
  date: string;
  summary: TranslatedSegment[];
  content: TranslatedSegment[];
  tags: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  source?: string;
  contentWarning?: string;
  image?: string;
  meta?: StoryMeta;
}
