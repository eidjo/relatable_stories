export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineEvent {
  date: string; // ISO date format YYYY-MM-DD
  title: string;
  description: string;
  severity: Severity;
  source?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
}
