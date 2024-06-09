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

```
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

// add body parsing middleware
app.use(express.urlencoded({ extended: false }));

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

```
// app.js
...

// define handlers
app.get('/my-form', (req, res) => {
  const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
  res.send(`
    <p>CSRF token value: ${csrfToken}</p>
    <h2>HTML Form Submission Example:</h2>
    <form action="/my-form" method="post">
      <legend>Form without CSRF (should fail):</legend>
      <input type="text" name="input1" />
      <button type="submit">Submit</button>
    </form>
    <br />
    <form action="/my-form" method="post">
      <legend>Form with incorrect CSRF (should fail):</legend>
      <input type="hidden" name="csrf_token" value="notvalid" />
      <input type="text" name="input1" />
      <button type="submit">Submit</button>
    </form>
    <br />
    <form action="/my-form" method="post">
      <legend>Form with CSRF (should succeed):</legend>
      <input type="hidden" name="csrf_token" value="${csrfToken}" />
      <input type="text" name="input1" />
      <button type="submit">Submit</button>
    </form>
  `);
});

app.post('/my-form', (req, res) => {
  res.send('success');
});

...
```
