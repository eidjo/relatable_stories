import { redirect } from '@sveltejs/kit';

// Redirect to the default story (Raha-2026)
export function load() {
  throw redirect(307, '/stories/raha-2026');
}
