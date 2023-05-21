'use client';

import React, { useState } from 'react';

export default function Form({csrfToken }: { csrfToken: string }) {
  const [input, setInput] = useState('');
  const onChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    console.log('onChange');
    setInput(event.target.value);
  };
  const formSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/form-handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,  // this should fail without this line and a valid CSRF token
      },
    });
    if (!response.ok) {
      console.error('Form submission failed');
      return ;
    }
    console.log('Form submission succeeded');
  };
  return (
    <form
      onSubmit={formSubmitHandler}
    >
      <input 
        type="text"
        name="input"
        value={input}
        aria-label="input"
        onChange={onChange}
      />
      <button type="submit">Submit</button>
    </form>
  );
}