import type { Handle } from '@sveltejs/kit';
import csrf from 'edge-csrf/sveltekit';

// https://kit.svelte.dev/docs/hooks

// initalize csrf protection handle
export const handle: Handle = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});
