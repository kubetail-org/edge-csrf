# Next.js

This is the documentation for the Edge-CSRF Next.js integration.

## Quickstart

First, add Edge-CSRF as a dependency to your app:

```console
npm install edge-csrf
# or
pnpm add edge-csrf
# or
yarn add edge-csrf
```

Next, create a middleware file (`middleware.ts`) for your project and add the Edge-CSRF middleware:

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

```
createMiddleware([, options]) - Create a new instance of Next.js middleware

  * @param {Partial<Config>} options - The configuration options
  * @returns {Middleware} - The middleware

createCsrfProtect([, options]) - Create a lower-level function that can be used inside Next.js middleware
                                 to implement CSRF protection for requests

  * @param {Partial<Config>} options - The configuration options
  * @returns {CsrfProtectFunction} - The CSRF protection function
```
