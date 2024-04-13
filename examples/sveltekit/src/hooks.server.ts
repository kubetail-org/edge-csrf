import type { Handle } from '@sveltejs/kit';
import csrf from 'edge-csrf/sveltekit';

// https://kit.svelte.dev/docs/hooks

// initalize protection function
const csrfProtectHandle = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const handle: Handle = csrfProtectHandle;
