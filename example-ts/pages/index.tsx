import type { GetServerSideProps } from 'next';
import React from 'react';

type Props = {
  csrfToken: string
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const csrfToken = res.getHeader('x-csrf-token');
  return { props: { csrfToken } };
}

const Home: React.FunctionComponent<Props> = ({ csrfToken }) => {
  return (
    <>
      <p>CSRF token value: {csrfToken || 'missing'}</p>
      <form action="/api/form-handler" method="post">
        <legend>Form without CSRF (should fail):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action="/api/form-handler" method="post">
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action="/api/form-handler" method="post">
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}

export default Home;
