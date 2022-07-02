export async function getServerSideProps({ req, res }) {
  const csrfToken = res.getHeader('x-csrf-token') || 'missing';
  return {props: { csrfToken }};
}

export default function Home({ csrfToken }) {
  return (
    <>
      <p>CSRF token value: {csrfToken}</p>
      <form action="/api/example" method="post">
        <legend>Form without CSRF (should fail):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action="/api/example" method="post">
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action="/api/example" method="post">
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
