'use client';

import Link from 'next/link';

import '../../styles/globals.css';

export default function Page() {
  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    // prevent default form submission
    ev.preventDefault()

    // get form values
    const data = new FormData(ev.currentTarget);

    // get token (see middleware.ts)
    const csrfResp = await fetch('/csrf-token');
    const { csrfToken } = await csrfResp.json();

    // build fetch args
    const fetchArgs = { method: 'POST', headers: {}, body: JSON.stringify(data) };
    if (csrfToken) fetchArgs.headers = { 'X-CSRF-Token': csrfToken };

    // send to backend
    const response = await fetch('/form-handler', fetchArgs);

    // show response
    alert(response.statusText);
  }

  return (
    <>
      <Link href="/">&laquo; back</Link>
      <h2>Static Optimized Example:</h2>
      <form action="/form-handler" method="post" onSubmit={handleSubmit}>
        <legend>Form fetches CSRF token before submission (should succeed):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
