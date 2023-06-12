import { headers } from 'next/headers';
import Link from 'next/link';

import '../../styles/globals.css';

export default function Page() {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  return (
    <>
      <Link href="/">&laquo; back</Link>
      <h2>HTML Form Submission Example:</h2>
      <p>CSRF token value: {csrfToken}</p>
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
    </>
  );
}
