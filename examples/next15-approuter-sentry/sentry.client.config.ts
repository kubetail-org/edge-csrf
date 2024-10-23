// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import type { BaseTransportOptions } from '@sentry/types';

async function fetchWithCSRFHeader(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  // get csrf token (see middleware.ts)
  const csrfResp = await fetch('/csrf-token');
  const { csrfToken } = await csrfResp.json();

  // add token to headers
  const headers = new Headers(init.headers);
  headers.append('X-CSRF-Token', csrfToken);

  // construct init object with the updated headers
  const modifiedInit = { ...init, headers };

  // call native fetch function with the original input and the modified init object
  return fetch(input, modifiedInit);
}

Sentry.init({
  dsn: "https://REPLACEME.ingest.sentry.io/REPLACEME",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  transport: (options: BaseTransportOptions) => {
    return Sentry.makeFetchTransport(options, fetchWithCSRFHeader);
  }
});
