import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const csrfToken = headers().get('X-CSRF-Token') || 'missing';

  return {
    other: {
      'x-csrf-token': csrfToken
    }
  }
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
