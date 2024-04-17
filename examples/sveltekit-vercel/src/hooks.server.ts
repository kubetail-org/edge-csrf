import type { Handle } from '@sveltejs/kit';
import { createHandle } from 'edge-csrf/sveltekit';

// initalize csrf protection handle
export const handle: Handle = createHandle({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});
