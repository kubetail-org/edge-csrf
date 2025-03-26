# Edge-CSRF

Edge-CSRF is a CSRF protection library for JavaScript that runs on the [edge runtime](https://edge-runtime.vercel.app/).

The Edge-CSRF library helps you to implement the [signed double submit cookie pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#signed-double-submit-cookie-recommended) except it only uses edge runtime dependencies so it can be used in both node environments and in edge functions (e.g. [Vercel Edge Functions](https://vercel.com/docs/functions/runtimes/edge-runtime), [Cloudflare Page Functions](https://developers.cloudflare.com/pages/functions/)). The recommended way to use this library is via its drop-in integrations for Next.js and SvelteKit though it also has a lower-level API for more custom implementations.

We hope you enjoy using this software. Contributions and suggestions are welcome!

## Features

- Runs on both node and edge runtimes
- Includes integrations for [Next.js](packages/nextjs), [Sveltekit](packages/sveltekit), [Express](packages/express) and [Node-HTTP](packages/node-http)
- Includes a low-level API for custom integrations ([see here](packages/core))
- Gets token from HTTP request header (`X-CSRF-Token`) or from request body
- Handles form-urlencoded, multipart/form-data or json-encoded HTTP request bodies
- Supports Server Actions via form and non-form submission
- Customizable cookie and other options

## Integrations

* [Next.js](packages/nextjs)
* [SvelteKit](packages/sveltekit)
* [Express](packages/express)
* [Node-HTTP](packages/node-http)
* [Core API](packages/core)

## Quickstart (Next.js)

First, install Edge-CSRF's Next.js integration library:

```console
npm install @edge-csrf/nextjs
# or
pnpm add @edge-csrf/nextjs
# or
yarn add @edge-csrf/nextjs
```

Next, create a middleware file (`middleware.ts`) for your project and add the Edge-CSRF middleware:

```typescript
// middleware.ts

import { createCsrfMiddleware } from '@edge-csrf/nextjs';

// initalize csrf protection middleware
const csrfMiddleware = createCsrfMiddleware({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function middleware(request: NextRequest) {
    const response = await csrfMiddleware(request);
    return response;
}
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `X-CSRF-Token` HTTP response header server-side or client-side. For example:

```typescript
// app/page.tsx

import { headers } from 'next/headers';

export default async function Page() {
  // NOTE: headers() don't need to be awaited in Next14
  const h = await headers();
  const csrfToken = h.get('X-CSRF-Token') || 'missing';

  return (
    <form action="/api/form-handler" method="post">
      <input type="hidden" name="csrf_token" value={csrfToken}>
      <input type="text" name="my-input">
      <input type="submit">
    </form>
  );
}
```

```typescript
// app/form-handler/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ status: 'success' });
}
```

For more Next.js examples see the [package documentation](packages/nextjs).

## Quickstart (SvelteKit)

First, install Edge-CSRF's SvelteKit integration library:

```console
npm install @edge-csrf/sveltekit
# or
pnpm add @edge-csrf/sveltekit
# or
yarn add @edge-csrf/sveltekit
```

Next, create a server-side hooks file (`hooks.server.ts`) for your project and add the Edge-CSRF handle:

```typescript
// src/hooks.server.ts

import { createCsrfHandle } from '@edge-csrf/sveltekit';

// initalize csrf protection handle
const csrfHandle = createCsrfHandle({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const handle = csrfHandle;
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the event's `locals` data object server-side. For example:

```typescript
// src/routes/+page.server.ts

export async function load({ locals }) {
  return {
    csrfToken: locals.csrfToken,
  };
}

export const actions = {
  default: async () => {
    return { success: true };
  },
};
```

```svelte
<!-- src/routes/+page.svelte -->

<script lang="ts">
  export let data;

  export let form;
</script>

{#if form?.success}
<span>success</span>
{:else}
<form method="post">
  <input type="hidden" name="csrf_token" value={data.csrfToken}>
  <input type="text" name="my-input">
  <input type="submit">
</form>
{/if}
```

Finally, to make typescript aware of the new `locals` attributes you can add Edge-CSRF types to your app's types:

```typescript
// src/app.d.ts

import type { CsrfLocals } from '@edge-csrf/sveltekit';

declare global {
  namespace App {
    // ...
    interface Locals extends CsrfLocals {}
    // ...
  }
}

export {};
```

## Quickstart (Express)

First, install Edge-CSRF's Express integration library:

```console
npm install @edge-csrf/express
# or
pnpm add @edge-csrf/express
# or
yarn add @edge-csrf/express
```

Next, add the Edge-CSRF middleware to your app:

```javascript
// app.js

import { createCsrfMiddleware } from '@edge-csrf/express';
import express from 'express';

// initalize csrf protection middleware
const csrfMiddleware = createCsrfMiddleware({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

// init app
const app = express();
const port = 3000;

// add csrf middleware
app.use(csrfMiddleware);

// define handlers
app.get('/', (req, res) => {
  const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
  res.send(`
    <!doctype html>
    <html>
      <body>
        <p>CSRF token value: ${csrfToken}</p>
        <form action="/" method="post">
          <legend>Form with CSRF (should succeed):</legend>
          <input type="hidden" name="csrf_token" value="${csrfToken}" />
          <input type="text" name="input1" />
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/', (req, res) => {
  res.send('success');
});

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
```

With the middleware installed, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token.

## Quickstart (Node-HTTP)

First, install Edge-CSRF's Node-HTTP integration library:

```console
npm install @edge-csrf/node-http
# or
pnpm add @edge-csrf/node-http
# or
yarn add @edge-csrf/node-http
```

Next, add the Edge-CSRF CSRF protection function to your request handlers:

```javascript
// server.js

import { createServer } from 'http';

import { createCsrfProtect } from '@edge-csrf/node-http';

// initalize csrf protection middleware
const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

// init server
const server = createServer(async (req, res) => {
  // apply csrf protection
  try {
    await csrfProtect(req, res);
  } catch (err) {
    if (err instanceof CsrfError) {
      res.writeHead(403);
      res.end('invalid csrf token');
      return;
    }
    throw err;
  }

  // add handler
  if (req.url === '/') {
    if (req.method === 'GET') {
      const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!doctype html>
        <html>
          <body>
            <form action="/" method="post">
              <legend>Form with CSRF (should succeed):</legend>
              <input type="hidden" name="csrf_token" value="${csrfToken}" />
              <input type="text" name="input1" />
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `);
      return;
    }

    if (req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('success');
      return;
    }
  }

  res.writeHead(404);
  res.end('not found');
});

// start server
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
```

With the CSRF protection method, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token.

## Development

### Get the code

To develop edge-csrf, first clone the repository then install the dependencies:

```console
git clone git@github.com:kubetail-org/edge-csrf.git
cd edge-csrf
pnpm install
```

### Run the unit tests

Edge-CSRF uses jest for testing (via vitest). To run the tests in node, edge and miniflare environments, use the `test-all` command:

```console
pnpm test-all
```

The test files are colocated with the source code in each package's `src/` directory, with the filename format `{name}.test.ts`.

### Build for production

To build Edge-CSRF for production, run the `build` command:

```console
pnpm build
```

The build artifacts will be located in the `dist/` directory of each package.
