import { createHandle } from '@edge-csrf/sveltekit';

// initalize csrf protection handle
const csrfHandle = createHandle({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const handle = csrfHandle;
