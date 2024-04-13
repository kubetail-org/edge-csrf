# Edge-CSRF

Edge-CSRF is CSRF protection for [Next.js](https://nextjs.org/) that runs in middleware (edge runtime).

This library uses the cookie strategy from [expressjs/csurf](https://github.com/expressjs/csurf) and the crypto logic from [pillarjs/csrf](https://github.com/pillarjs/csrf) except it only uses Next.js edge runtime dependencies so it can be used in [Next.js middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware).

## Features

- Supports app-router and pages-router Next.js 13 and Next.js 14
- Runs in edge runtime
- Implements cookie strategy from [expressjs/csurf](https://github.com/expressjs/csurf) and the crypto logic from [pillarjs/csrf](https://github.com/pillarjs/csrf)
- Gets token from HTTP request header (`X-CSRF-Token`) or from request body field (`csrf_token`)
- Handles form-urlencoded, multipart/form-data or json-encoded HTTP request bodies
- Customizable cookie options
- TypeScript definitions included

**Note: There's an issue with Next.js middleware in v13.3.X and v13.4.X that prevents edge-csrf from working properly with the pages-router in a dev environment (https://github.com/vercel/next.js/issues/48083, https://github.com/vercel/next.js/issues/48546)**

## Quickstart

To use Edge-CSRF, first add it as a dependency to your app:

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

import csrf from 'edge-csrf';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// initalize protection function
const csrfProtect = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // csrf protection
  const csrfError = await csrfProtect(request, response);

  // check result
  if (csrfError) {
      return new NextResponse('invalid csrf token', { status: 403 });
  }
    
  return response;
}
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

## Examples

See more examples in the [examples](examples) directory in this repository:

| Next.js Version | Router | Implementation                                                                          |
| --------------- | ------ | --------------------------------------------------------------------------------------- |
| 13              | app    | [HTML form](examples/next13-approuter-html-submission)                                  |
| 13              | app    | [JavaScript (dynamic)](examples/next13-approuter-js-submission-dynamic)                 |
| 13              | app    | [JavaScript (static)](examples/next13-approuter-js-submission-static)                   |
| 13              | pages  | [HTML form](examples/next13-pagesrouter-html-submmission)                               |
| 14              | app    | [HTML form](examples/next14-approuter-html-submission)                                  |
| 14              | app    | [JavaScript (dynamic)](examples/next14-approuter-js-submission-dynamic)                 |
| 14              | app    | [JavaScript (static)](examples/next14-approuter-js-submission-static)                   | 
| 14              | app    | [Sentry](examples/next14-approuter-sentry)                                              |
| 14              | app    | [Server action (form)](examples/next14-approuter-server-action-form-submission)         |
| 14              | app    | [Server action (non-form)](examples/next14-approuter-server-action-non-form-submission) |
| 14              | pages  | [HTML form](examples/next14-pagesrouter-html-submission)                                |

## Server Actions

Edge-CSRF supports server actions with both form and non-form submission in the latest version of Next.js (14).

### Form Submission

With server actions that get executed via form submission, you can add the CSRF token as a hidden field to the form ([see example](examples/next14-approuter-server-action-form-submission)):

```tsx
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Page() {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  async function myAction(formData: FormData) {
    'use server';
    console.log('passed csrf validation');
    revalidatePath('/');
    redirect('/');
  }

  return (
    <form action={myAction}>
      <legend>Server Action with Form Submission Example:</legend>
      <input type="hidden" name="csrf_token" value={csrfToken} />
      <input type="text" name="myarg" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Non-Form Submission

With server actions that get executed by JavaScript calls (non-form), you can pass the CSRF token as the first argument to the function ([see example](examples/next14-approuter-server-action-non-form-submission)):

```tsx
// lib/actions.ts
'use server';

export async function exampleFn(csrfToken: string, data: { key1: string; key2: string; }) {
  console.log(data);
}

```

```tsx
// app/page.tsx
'use client';

import { exampleFn } from '../lib/actions';

export default function Page() {
  const handleClick = async () => {
    const csrfResp = await fetch('/csrf-token');
    const { csrfToken } = await csrfResp.json();

    const data = { 
      key1: 'val1',
      key2: 'val2',
    };

    // use token as first argument to server action
    await exampleFn(csrfToken, data);
  };

  return (
    <>
      <h2>Server Action with Non-Form Submission Example:</h2>
      <button onClick={handleClick}>Click me</button>
    </>
  );
}
```

## Configuration

To configure the CSRF middleware function just pass an object containing your options to the initialization method:

```javascript
const csrfProtect = csrf({
  cookie: {
    name: '_myCsrfSecret'
  },
  secretByteLength: 20
});
```

Here are the default configuration values:

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

## Development

### Get the code

To develop edge-csrf, first clone the repository then install the dependencies:

```console
git clone git@github.com:kubetail-org/edge-csrf.git
cd edge-csrf
pnpm install
```

### Run the unit tests

Edge-CSRF uses jest for testing (via vitest). To run the tests, use the `test` command:

```console
pnpm test
```

The test files are colocated with the source code in the `src/` directory, with the filename format `{name}.test.ts`.

### Build for production

To build Edge-CSRF for production, run the `build` command:

```console
pnpm build
```

The production files will be located in the `dist/` directory.
