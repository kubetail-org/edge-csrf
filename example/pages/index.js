export async function getServerSideProps({ req, res }) {
  const csrfToken = res.getHeader('X-CSRF-Token') || 'missing';
  return {props: { csrfToken }};
}

export default function Home({ csrfToken }) {
  return (
    <>
      <p>CSRF token value: {csrfToken}</p>
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
        <legend>Form with valid CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
