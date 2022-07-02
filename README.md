# Edge-CSRF

Edge-CSRF is CSRF protection middleware for [Next.js](https://nextjs.org/) that runs in the edge runtime.

This library uses the cookie strategy from [`expressjs/csurf`](https://github.com/expressjs/csurf) and the crypto logic from ['pillarjs/csrf'](https://github.com/pillarjs/csrf) except it only uses Next.js edge runtime dependencies so it can be used in [Next.js middleware](https://nextjs.org/docs/advanced-features/middleware).

# Features

- Runs in edge runtime
- Gets token from HTTP request header (`x-csrf-token`) or from request body field (`csrf_token`)
- Handles form-urlencoded or json-encoded HTTP request bodies
- Customizable cookie options

# Quickstart

To use Edge-CSRF, first add it as a dependency to your app:

```bash
npm install edge-csrf
```

Next, create a middleware file (`middleware.js`) for your project and add the Edge-CSRF middleware:

```javascript
// middleware.js

import csrf from 'edge-csrf';
import { NextResponse } from 'next/server';

// initalize protection function
const csrfProtect = csrf();

export async function middleware(request) {
  const response = NextResponse.next();

  // csrf protection
  const csrfError = await csrfProtect(request, response);
  if (csrfError) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/csrf-invalid';
    return NextResponse.rewrite(url);
  }
    
  return response;
}
```

Next, create a handler to return CSRF error messages to the user:

```javascript
// pages/api/csrf-invalid.js

export default function handler(req, res) {
  res.status(403).send('invalid csrf token');
}
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `x-csrf-token` HTTP response header server-side or client-side. For example:

```javascript
// pages/my-form.js

export function getServerSideProps({ res }) {
  const csrfToken = res.getHeader('x-csrf-token') || '';
  return {props: { csrfToken }};
}

export default function MyFormPage({ csrfToken }) {
  return (
    <form>
      <input type="hidden" value={csrfToken}>
      <input type="submit">
    </form>
  );
}
```

# Configuration

```javascript
// default config

{
  cookie: {
    name: '_csrfSecret',
    path: '/',
    maxAge: 60 * 60 * 12,
    domain: '',
    secure: true,
    httpOnly: true,
    sameSite: 'String'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  saltByteLength: 8,
  secretByteLength: 8,
  token: {
    responseHeader: 'x-csrf-token',
    value: null
  }
}
```

TODO:
- Add details to error response
- Handle malformed inputs
- Typescript support
- Use session cookie
