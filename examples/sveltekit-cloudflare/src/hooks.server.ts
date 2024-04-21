import { createCsrfHandle } from '@edge-csrf/sveltekit';

// initalize csrf protection handle
const csrfHandle = createCsrfHandle({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const handle = csrfHandle;
