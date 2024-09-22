# Express

This is the documentation for Edge-CSRF's Express integration.

## Quickstart

First, add the integration library as a dependency:

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
app.get('/', (_, res) => {
  res.status(200).json({ success: true });
});

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
```

Now, all HTTP submission requests (e.g. POST, PUT, DELETE, PATCH) will be rejected if they do not include a valid CSRF token. To add the CSRF token to your forms, you can fetch it from the `X-CSRF-Token` HTTP response header server-side or client-side. For example:

```javascript
// app.js
...

// define handlers
app.get('/my-form', (req, res) => {
  const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
  res.send(`
    <!doctype html>
    <html>
      <body>
        <p>CSRF token value: ${csrfToken}</p>
        <form action="/my-form" method="post">
          <legend>Form with CSRF (should succeed):</legend>
          <input type="hidden" name="csrf_token" value="${csrfToken}" />
          <input type="text" name="input1" />
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/my-form', (req, res) => {
  res.send('success');
});

...
```

## Example

Check out the example Express app in this repository: [Express example](examples/express).

## Lower-level implementations

If you want lower-level control over the response or which routes CSRF protection will be applied to you can use the `createCsrfProtect()` method to create a function that you can use inside your own custom middleware:

```typescript
// app.js

import { CsrfError, createCsrfProtect } from '@edge-csrf/express';
import express from 'express';

// initalize csrf protection method
const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

// init app
const app = express();
const port = 3000;

// add csrf middleware
app.use(async (req, res, next) => {
  try {
    await csrfProtect(req, res)
  } catch (err) {
    if (err instanceof CsrfError) {
      res.statusCode = 403;
      res.send('invalid csrf token');
      res.end();
      return;
    }
    throw err;
  }
});

// define handlers
app.get('/', (_, res) => {
  res.status(200).json({ success: true });
});

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
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
  excludePathPrefixes: [],
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  saltByteLength: 8,
  secretByteLength: 18,
  token: {
    fieldName: 'csrf_token',
    responseHeader: 'X-CSRF-Token'
  }
}
```

## API

The following are named exports in the the `@edge-csrf/express` module:

### Types

```
ExpressCsrfProtect - A function that implements CSRF protection for Express requests

  * @param {Request} request - The Express request instance
  * @param {Response} response - The Express response instance
  * @returns {Promise<void>} - The function completed successfully
  * @throws {CsrfError} - The function encountered a CSRF error
```

### Classes

```
CsrfError - A class that inherits from Error and represents CSRF errors
```

### Methods

```
createCsrfMiddleware([, options]) - Create a new instance of Express middleware

  * @param {object} options - The configuration options
  * @returns {ReqestHandler} - The middleware

createCsrfProtect([, options]) - Create a lower-level function that can be used inside Express middleware
                                 to implement CSRF protection for requests

  * @param {object} options - The configuration options
  * @returns {ExpressCsrfProtect} - The CSRF protection function
```
