import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  return {
    title: 'edge-csrf example',
    other: {
      'x-csrf-token': csrfToken,
    },
  };
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
