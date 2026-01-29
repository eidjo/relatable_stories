import { sveltekit } from '@sveltejs/kit/vite';
import { svelte_component_to_image } from 'svelte-component-to-image/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true, // Listen on all addresses
    allowedHosts: ['localhost', '.ngrok.io', '.ngrok-free.dev', '.ngrok.app'],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'jsdom',
  },
});
