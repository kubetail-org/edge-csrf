# Edge-CSRF

Edge-CSRF is a CSRF protection library that runs on the [edge runtime](https://edge-runtime.vercel.app/).

This library helps you to implement the [signed double submit cookie pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#signed-double-submit-cookie-recommended) except it only uses edge runtime dependencies so it can be used in both node environments and in edge functions (e.g. [Vercel Edge Functions](https://vercel.com/docs/functions/runtimes/edge-runtime), [Cloudflare Page Functions](https://developers.cloudflare.com/pages/functions/)). The recommended way to use this library is via its drop-in integrations for [Next.js](src/nextjs) and [SvelteKit](src/sveltekit) though it also has a lower-level API for more custom implementations.

We hope you enjoy using this software. Contributions and suggestions are welcome!

## Features

- Runs on both node and edge runtimes
- Includes a Next.js integration ([see here](packages/nextjs))
- Includes a SvelteKit integration ([see here](packages/sveltekit))
- Includes a low-level API for custom integrations ([see here](packages/core))
- Handles form-urlencoded, multipart/form-data or json-encoded HTTP request bodies
- Gets token from HTTP request header or from request body
- Supports Server Actions via form and non-form submission
- Customizable cookie options

## Integrations

* [Next.js](packages/nextjs)
* [SvelteKit](packages/sveltekit)
* [Core API](packages/core)

## Quickstart (Next.js)

First, install the Edge-CSRF Next.js integration library:

```console
npm install @edge-csrf/nextjs
# or
pnpm add @edge-edge-csrf/nextjs
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

export const middleware = csrfMiddleware;
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `X-CSRF-Token` HTTP response header server-side or client-side. For example:

```typescript
// app/page.tsx

import { headers } from 'next/headers';

export default function Page() {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  return (
    <form action="/api/form-handler" method="post">
      <input type="hidden" value={csrfToken}>
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

## Quickstart (SvelteKit)

First, install the Edge-CSRF SvelteKit integration library:

```console
npm install @edge-csrf/sveltekit
# or
pnpm add @edge-edge-csrf/sveltekit
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
  <input type="hidden" value={data.csrfToken}>
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
