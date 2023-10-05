import { revalidatePath } from "next/cache";
import { headers } from 'next/headers';
import { redirect } from "next/navigation";
import Link from 'next/link';

import '../../styles/globals.css';

export default function Page() {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  async function myAction(formData: FormData) {
    'use server';
    console.log('passed csrf validation');
    revalidatePath('/server-action-example');
    redirect('/server-action-example');
  }

  return (
    <>
      <Link href="/">&laquo; back</Link>
      <p>CSRF token value: {csrfToken}</p>
      <h2>Server Action Server-Only Form Example:</h2>
      <form action={myAction}>
        <legend>Form without CSRF (should fail):</legend>
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="text" name="input1" />
        <button type="submit">Submit</button>
      </form>
      <h2>Server Action Server-Only File Upload Example:</h2>
      <form action={myAction}>
        <legend>Form without CSRF (should fail):</legend>
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with incorrect CSRF (should fail):</legend>
        <input type="hidden" name="csrf_token" value="notvalid" />
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
      <br />
      <form action={myAction}>
        <legend>Form with CSRF (should succeed):</legend>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="file" name="file1" />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
