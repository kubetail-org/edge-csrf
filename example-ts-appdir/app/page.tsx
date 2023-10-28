import Link from 'next/link';

import '../styles/globals.css';

export default function Page() {
  return (
    <>
      <p>Examples:</p>
      <ul>
        <li><Link href="/html-example">HTML form submission</Link></li>
        <li><Link href="/js-example">JavaScript form submission</Link></li>
        <li><Link href="/server-action-example">Server Action form submission</Link></li>
        <li><Link href="/static-optimized-example">Static Optimized Example</Link></li>
      </ul>
    </>
  );
}
