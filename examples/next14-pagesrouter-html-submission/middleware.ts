import { createMiddleware } from 'edge-csrf/nextjs';

// initalize csrf protection middleware
const csrfMiddleware = createMiddleware({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const middleware = csrfMiddleware;
