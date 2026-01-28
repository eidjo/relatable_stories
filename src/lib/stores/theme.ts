import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'dark';

function getStoredTheme(): Theme | null {
  if (!browser) return null;
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme) || null;
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme): void {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to store theme:', error);
  }
}

function applyTheme(theme: Theme): void {
  if (!browser) return;

  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
}

const initialTheme = getStoredTheme() || DEFAULT_THEME;

export const theme = writable<Theme>(initialTheme);

if (browser) {
  // Apply initial theme
  applyTheme(initialTheme);

  // Subscribe to changes
  theme.subscribe((newTheme) => {
    storeTheme(newTheme);
    applyTheme(newTheme);
  });
}

export function toggleTheme(): void {
  theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
}
