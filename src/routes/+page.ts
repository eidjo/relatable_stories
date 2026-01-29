import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';

// Redirect to the default story (Raha-2026)
export function load() {
  throw redirect(307, `${base}/stories/raha-2026`);
}
