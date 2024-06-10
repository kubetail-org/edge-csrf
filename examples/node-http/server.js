import { createServer } from 'http';

import { CsrfError, createCsrfProtect } from '@edge-csrf/node-http';

// initalize csrf protection method
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
            <p>CSRF token value: ${csrfToken}</p>
            <h2>HTML Form Submission Example:</h2>
            <form action="/" method="post">
              <legend>Form without CSRF (should fail):</legend>
              <input type="text" name="input1" />
              <button type="submit">Submit</button>
            </form>
            <br />
            <form action="/" method="post">
              <legend>Form with incorrect CSRF (should fail):</legend>
              <input type="hidden" name="csrf_token" value="notvalid" />
              <input type="text" name="input1" />
              <button type="submit">Submit</button>
            </form>
            <br />
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
