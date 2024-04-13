import type { Handle } from '@sveltejs/kit';
import csrf from 'edge-csrf/sveltekit';

// initalize csrf protection handle
export const handle: Handle = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});
