import Link from 'next/link';

import '../styles/globals.css';

export default function Page() {
  return (
    <>
      <p>Examples:</p>
      <ul>
        <li><Link href="/html-example">HTML form submission</Link></li>
        <li><Link href="/js-example">JavaScript form submission</Link></li>
      </ul>
    </>
  );
}
