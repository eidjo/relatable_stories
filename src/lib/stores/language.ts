import { writable } from 'svelte/store';

export type LanguageCode = string;

// Default to English
export const selectedLanguage = writable<LanguageCode>('en');
