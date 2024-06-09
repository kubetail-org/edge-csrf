import { createCsrfMiddleware } from '@edge-csrf/express';
//import bodyParser from 'body-parser';
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
app.get('/', (req, res) => {
  const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
  res.send(`
    <p>CSRF token value: ${csrfToken}</p>
    <h2>HTML Form Submission Example:</h2>
    <form action="/form-handler" method="post">
      <legend>Form without CSRF (should fail):</legend>
      <input type="text" name="input1" />
      <button type="submit">Submit</button>
    </form>
    <br />
    <form action="/form-handler" method="post">
      <legend>Form with incorrect CSRF (should fail):</legend>
      <input type="hidden" name="csrf_token" value="notvalid" />
      <input type="text" name="input1" />
      <button type="submit">Submit</button>
    </form>
    <br />
    <form action="/form-handler" method="post">
      <legend>Form with CSRF (should succeed):</legend>
      <input type="hidden" name="csrf_token" value="${csrfToken}" />
      <input type="text" name="input1" />
      <button type="submit">Submit</button>
    </form>
  `);
});

app.post('/form-handler', (req, res) => {
  res.send('success');
});

// start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
