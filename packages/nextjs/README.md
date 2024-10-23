# Next.js

This is the documentation for Edge-CSRF's Next.js integration. The integration works with Next.js 13, 14 and 15.

## Quickstart

First, add the integration library as a dependency to your app:

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

export const middleware = csrfMiddleware;
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `X-CSRF-Token` HTTP response header server-side or client-side. For example:

### App Router

```typescript
// app/page.tsx

import { headers } from 'next/headers';

export default async function Page() {
  const h = await headers();
  const csrfToken = h.get('X-CSRF-Token') || 'missing';

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

## Examples

Here are some [examples](examples) in this repository:

| Version    | Router       | Implementation                                                                          |
| ---------- | ------------ | --------------------------------------------------------------------------------------- |
| Next.js 13 | app router   | [HTML form](examples/next13-approuter-html-submission)                                  |
| Next.js 13 | app router   | [JavaScript (dynamic)](examples/next13-approuter-js-submission-dynamic)                 |
| Next.js 13 | app router   | [JavaScript (static)](examples/next13-approuter-js-submission-static)                   |
| Next.js 13 | pages router | [HTML form](examples/next13-pagesrouter-html-submmission)                               |
| Next.js 14 | app router   | [HTML form](examples/next14-approuter-html-submission)                                  |
| Next.js 14 | app router   | [JavaScript (dynamic)](examples/next14-approuter-js-submission-dynamic)                 |
| Next.js 14 | app router   | [JavaScript (static)](examples/next14-approuter-js-submission-static)                   |
| Next.js 14 | app router   | [Sentry](examples/next14-approuter-sentry)                                              |
| Next.js 14 | app router   | [Server action (form)](examples/next14-approuter-server-action-form-submission)         |
| Next.js 14 | app router   | [Server action (non-form)](examples/next14-approuter-server-action-non-form-submission) |
| Next.js 14 | pages router | [HTML form](examples/next14-pagesrouter-html-submission)                                |
| Next.js 15 | app router   | [HTML form](examples/next15-approuter-html-submission)                                  |
| Next.js 15 | app router   | [JavaScript (dynamic)](examples/next15-approuter-js-submission-dynamic)                 |
| Next.js 15 | app router   | [JavaScript (static)](examples/next15-approuter-js-submission-static)                   |
| Next.js 15 | app router   | [Sentry](examples/next15-approuter-sentry)                                              |
| Next.js 15 | app router   | [Server action (form)](examples/next15-approuter-server-action-form-submission)         |
| Next.js 15 | app router   | [Server action (non-form)](examples/next15-approuter-server-action-non-form-submission) |
| Next.js 15 | pages router | [HTML form](examples/next15-pagesrouter-html-submission)                                |

## Lower-level implementations

If you want lower-level control over the response or which routes CSRF protection will be applied to you can use the `createCsrfProtect()` method to create a function that you can use inside your own custom middleware:

```typescript
// middleware.ts

import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// initalize csrf protection method
const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

// Next.js middleware function
export const middleware = async (request: NextRequest) => {
  const response = NextResponse.next();

  try {
    await csrfProtect(request, response);
  } catch (err) {
    if (err instanceof CsrfError) return new NextResponse('invalid csrf token', { status: 403 });
    throw err;
  }

  return response;
};
```

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
    fieldName: 'csrf_token',
    responseHeader: 'X-CSRF-Token',
    value: undefined
  }
}
```

## API

The following are named exports in the the `@edge-csrf/nextjs` module:

### Types

```
NextCsrfProtect - A function that implements CSRF protection for Next.js requests

  * @param {NextRequest} request - The Next.js request instance
  * @param {NextResponse} response - The Next.js response instance
  * @returns {Promise<void>} - The function completed successfully
  * @throws {CsrfError} - The function encountered a CSRF error
```

### Classes

```
CsrfError - A class that inherits from Error and represents CSRF errors
```

### Methods

```
createCsrfMiddleware([, options]) - Create a new instance of Next.js middleware

  * @param {object} options - The configuration options
  * @returns {Middleware} - The middleware

createCsrfProtect([, options]) - Create a lower-level function that can be used inside Next.js middleware
                                 to implement CSRF protection for requests

  * @param {object} options - The configuration options
  * @returns {NextCsrfProtect} - The CSRF protection function
```
