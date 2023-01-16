# Edge-CSRF

Edge-CSRF is CSRF protection for [Next.js](https://nextjs.org/) middleware that runs in the edge runtime.

This library uses the cookie strategy from [expressjs/csurf](https://github.com/expressjs/csurf) and the crypto logic from [pillarjs/csrf](https://github.com/pillarjs/csrf) except it only uses Next.js edge runtime dependencies so it can be used in [Next.js middleware](https://nextjs.org/docs/advanced-features/middleware).

# Features

- Supports Next.js 13
- Runs in edge runtime
- Implements cookie strategy from [expressjs/csurf](https://github.com/expressjs/csurf) and the crypto logic from [pillarjs/csrf](https://github.com/pillarjs/csrf)
- Gets token from HTTP request header (`X-CSRF-Token`) or from request body field (`csrf_token`)
- Handles form-urlencoded or json-encoded HTTP request bodies
- Customizable cookie options
- TypeScript definitions included

# Quickstart

To use Edge-CSRF, first add it as a dependency to your app:

```bash
npm install edge-csrf
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

:boom: Note: the example above sends a response directly from middleware. This feature is enabled by default in Next.js 13.1+. To enable this in Next.js 13.0.X you must set the `allowMiddlewareResponseBody` flag in the Next.js config file. Alternatively, you can use `NextResponse.rewrite()` to handle the response.

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `X-CSRF-Token` HTTP response header server-side or client-side. For example:

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

# Configuration

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
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePathPrefixes: ['/_next/'],
  saltByteLength: 8,
  secretByteLength: 18,
  token: {
    responseHeader: 'X-CSRF-Token',
    value: undefined
  }
}
```
