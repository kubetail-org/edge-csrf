# Node-HTTP

This is the documentation for Edge-CSRF's Node built-in http module integration.

## Quickstart

First, add the integration library as a dependency:

```console
npm install @edge-csrf/node-http
# or
pnpm add @edge-csrf/node-http
# or
yarn add @edge-csrf/node-http
```

Next, add the Edge-CSRF CSRF protection function to your app:

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

## Example

Check out the example Node-HTTP server in this repository: [Node-HTTP example](/examples/node-http).

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
    sameSite: 'strict',
    partitioned: undefined
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

The following are named exports in the the `@edge-csrf/node-http` module:

### Types

```
NodeHttpCsrfProtect - A function that implements CSRF protection for Node http requests

  * @param {IncomingMessage} request - The Node HTTP module request instance
  * @param {ServerResponse} response - The Node HTTP module response instance
  * @returns {Promise<void>} - The function completed successfully
  * @throws {CsrfError} - The function encountered a CSRF error
```

### Classes

```
CsrfError - A class that inherits from Error and represents CSRF errors
```

### Methods

```
createCsrfProtect([, options]) - Create a function that can be used inside Node HTTP handlers
                                 to implement CSRF protection for requests

  * @param {object} options - The configuration options
  * @returns {NodeHttpCsrfProtect} - The CSRF protection function
```
