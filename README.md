# Edge-CSRF

Edge-CSRF is a CSRF protection library that runs on the [edge runtime](https://edge-runtime.vercel.app/) (as well as the node runtime).

This library implements the [signed double submit cookie pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#signed-double-submit-cookie-recommended) using the crypto logic from [pillarjs/csrf](https://github.com/pillarjs/csrf) except it only uses edge runtime dependencies so it can be used in both node environments and in edge functions (e.g. [Vercel Edge Functions](https://vercel.com/docs/functions/runtimes/edge-runtime), [Cloudflare Page Functions](https://developers.cloudflare.com/pages/functions/)). It comes with easy-to-use integrations for Next.js and SvelteKit plus a lower-level API for more custom implementations.

## Features

- Runs on both node and edge runtimes
- Includes Next.js integration ([see here](src/nextjs))
- Includes SvelteKit integration ([see here](src/sveltekit))
- Includes low-level API for custom integrations (see below)
- Gets token from HTTP request header (`X-CSRF-Token`) or from request body field (`csrf_token`)
- Handles form-urlencoded, multipart/form-data or json-encoded HTTP request bodies
- Supports Server Actions via form and non-form submission
- Customizable cookie options

## Install

To use Edge-CSRF, just add it as a dependency to your app:

```console
npm install edge-csrf
# or
pnpm add edge-csrf
# or
yarn add edge-csrf
```

## Integrations

For details about each integration see:

* [Next.js](src/nextjs)
* [SvelteKit](src/sveltekit)

## Next.js Quickstart (App Router)

## Next.js Quickstart (Pages Router)

## SvelteKit Quickstart

To integrate Edge-CSRF with [Next.js](https://nextjs.org/), create a middleware file (`middleware.ts`) for your project and add the Edge-CSRF middleware:

```typescript
// middleware.ts

import { createMiddleware } from 'edge-csrf/nextjs';

// initalize csrf protection middleware
const csrfMiddleware = createMiddleware({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export const middleware = csrfMiddleware;
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `X-CSRF-Token` HTTP response header server-side or client-side. For example:

### App Router

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
  return NextResponse.json({ status: 'success'});
}
```

### Pages Router

```typescript
// pages/form.ts

import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';

type Props = {
  csrfToken: string;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const csrfToken = res.getHeader('x-csrf-token') || 'missing';
  return { props: { csrfToken } };
}

const FormPage: NextPage<Props> = ({ csrfToken }) => {
  return (
    <form action="/api/form-handler" method="post">
      <input type="hidden" value={csrfToken}>
      <input type="text" name="my-input">
      <input type="submit">
    </form>
  );
}

export default FormPage;
```

```typescript
// pages/api/form-handler.ts

import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  status: string
};

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // this code won't execute unless CSRF token passes validation 
  res.status(200).json({ status: 'success' });
}
```

## Sveltekit

To integrate Edge-CSRF with [SvelteKit](https://kit.svelte.dev/), create a server-side hooks file (`hooks.server.ts`) for your project and add the Edge-CSRF handle:

```typescript
// src/hooks.server.ts

import { createHandle } from 'edge-csrf/sveltekit';

// initalize csrf protection handle
const csrfHandle = createHandle({
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

## Examples

See more examples in the [examples](examples) directory in this repository:

| Framework                 | Implementation                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Next.js 13 (app router)   | [HTML form](examples/next13-approuter-html-submission)                                  |
| Next.js 13 (app router)   | [JavaScript (dynamic)](examples/next13-approuter-js-submission-dynamic)                 |
| Next.js 13 (app router)   | [JavaScript (static)](examples/next13-approuter-js-submission-static)                   |
| Next.js 13 (pages router) | [HTML form](examples/next13-pagesrouter-html-submmission)                               |
| Next.js 14 (app router)   | [HTML form](examples/next14-approuter-html-submission)                                  |
| Next.js 14 (app router)   | [JavaScript (dynamic)](examples/next14-approuter-js-submission-dynamic)                 |
| Next.js 14 (app router)   | [JavaScript (static)](examples/next14-approuter-js-submission-static)                   | 
| Next.js 14 (app router)   | [Sentry](examples/next14-approuter-sentry)                                              |
| Next.js 14 (app router)   | [Server action (form)](examples/next14-approuter-server-action-form-submission)         |
| Next.js 14 (app router)   | [Server action (non-form)](examples/next14-approuter-server-action-non-form-submission) |
| Next.js 14 (pages router) | [HTML form](examples/next14-pagesrouter-html-submission)                                |
| SvelteKit (vercel)        | [HTML form](examples/sveltekit-vercel)                                                  |
| SvelteKit (cloudflare)    | [HTML form](examples/sveltekit-cloudflare)                                              |

## Configuration

```javascript
// default config

{
  cookie: {
    name: '_csrfSecret',
    path: '/',
    maxAge: undefined,
    domain: '',
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  },
  excludePathPrefixes: ['/_next/'],
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  saltByteLength: 8,
  secretByteLength: 18,
  token: {
    responseHeader: 'X-CSRF-Token',
    value: undefined
  }
}
```

## API



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

The test files are colocated with the source code in the `src/` directory, with the filename format `{name}.test.ts`.

### Build for production

To build Edge-CSRF for production, run the `build` command:

```console
pnpm build
```

The production files will be located in the `dist/` directory.
