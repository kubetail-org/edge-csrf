'use client';

import Link from 'next/link';

import '../../styles/globals.css';
import { useEffect, useState } from 'react';

export default function Page() {
  const [csrfToken, setCsrfToken] = useState<string>('loading...');

  useEffect(() => {
    const token = getCSRFToken()
    setCsrfToken(token || 'missing')
  }, []);

  // method to generate form handlers
  const onSubmit = (tokenVal: string | null): React.FormEventHandler<HTMLFormElement> => {
    return async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // get form values
      const data = new FormData(event.currentTarget);

      // build fetch args
      const fetchArgs = {method: 'POST', headers: {}, body: JSON.stringify(data)};
      if (tokenVal != null) fetchArgs.headers = {'X-CSRF-Token': tokenVal};
 
      // send to backend
      const response = await fetch('/form-handler', fetchArgs);

      // show response
      alert(response.statusText);
    };
  }

  return (
    <>
      <Link href="/">&laquo; back</Link>
      <h2>JavaScript Form Submission Example:</h2>
      <p>CSRF token value: {csrfToken}</p>
      <form onSubmit={onSubmit(null)}>
        <legend>Form without CSRF (should fail):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form onSubmit={onSubmit('notvalid')}>
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form onSubmit={onSubmit(csrfToken)}>
        <legend>Form with CSRF (should succeed):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

function getCSRFToken() {
  const cookies = document.cookie.split(';');
  
  for(let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    const [key, value] = cookie.split('=');
    
    // config.token.responseHeader
    if (key === 'X-CSRF-Token') {
      return value;
    }
  }
  
  return null;
}
