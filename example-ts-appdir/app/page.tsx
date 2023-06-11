import { headers } from 'next/headers';

import '../styles/globals.css';
import Form from './components/form';

export default function Page() {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';
  return (
    <>
      <p>CSRF token value: {csrfToken}</p>
      <h2>Example 1 (built-in form submission):</h2>
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
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <h2>Example 2 (javascript form submission):</h2>
      <Form csrfToken={csrfToken} />
    </>
  );
}
