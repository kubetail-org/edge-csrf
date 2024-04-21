import { headers } from 'next/headers';

import '../styles/globals.css';

export default function Page() {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  return (
    <>
      <p>
        CSRF token value:
        {csrfToken}
      </p>
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
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <h2>HTML File Upload Example:</h2>
      <form action="/form-handler" method="post" encType="multipart/form-data">
        <legend>Form without CSRF (should fail):</legend>
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action="/form-handler" method="post" encType="multipart/form-data">
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action="/form-handler" method="post" encType="multipart/form-data">
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
