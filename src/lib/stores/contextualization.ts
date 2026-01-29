import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Store for tracking whether contextualization is enabled
// DEFAULT: true (show local context - names, places, values translated)
// When false: show original Iranian context
// When true: show localized context (DEFAULT)
export const contextualizationEnabled = writable<boolean>(true);

// Load from localStorage on initialization
if (browser) {
  const stored = localStorage.getItem('contextualization-enabled');
  if (stored !== null) {
    contextualizationEnabled.set(stored === 'true');
  }
}

// Persist to localStorage on changes
contextualizationEnabled.subscribe(value => {
  if (browser) {
    localStorage.setItem('contextualization-enabled', String(value));
  }
});
