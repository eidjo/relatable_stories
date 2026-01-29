// Re-export V2 marker types
export * from './markers-v2.ts';

// Story-specific types
export interface StoryMeta {
  'og-title'?: string;
  'og-description'?: string;
}

export interface SourceReference {
  id: string; // Key used in {{source:id}} markers
  number: number; // Display number [1], [2], etc.
  title: string;
  url: string;
}

export interface ImageReference {
  id: string; // Key used in {{image:id}} markers
  src: string;
  alt: string;
  caption?: string;
  contentWarning?: string;
  credit?: string;
  creditUrl?: string;
}

export interface Story {
  id: string;
  title: string;
  slug: string;
  date: string;
  summary: string;
  content: string;
  markers: Record<string, import('./markers-v2').Marker>;
  sources?: SourceReference[]; // New: dedicated sources array
  images?: ImageReference[]; // New: dedicated images array
  tags: string[];
  hashtags?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  source?: string; // Attribution text
  'content-warning'?: string;
  image?: string; // Cover image URL
  meta?: StoryMeta;
}

export type MarkerType = string; // For backward compatibility

export interface TranslatedSegment {
  text: string;
  original: string | null;
  type: MarkerType | null;
  key: string | null;
  url?: string; // For source markers
  title?: string; // For source markers and images
  explanation?: string; // Math explanation for scaled values
  comparisonExplanation?: string; // Math explanation for casualty comparison
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
  hashtags?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  source?: string;
  contentWarning?: string;
  image?: string;
  meta?: StoryMeta;
}
