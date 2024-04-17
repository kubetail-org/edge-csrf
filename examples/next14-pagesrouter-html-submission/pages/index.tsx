import type { NextPage, GetServerSideProps } from 'next';

type Props = {
  csrfToken: string;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
  return { props: { csrfToken } };
}

const Home: NextPage<Props> = ({ csrfToken }) => {
  return (
    <>      
      <p>CSRF token value: {csrfToken}</p>
      <h2>HTML Form Submission Example</h2>
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
