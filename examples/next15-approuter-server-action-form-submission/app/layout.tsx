import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'edge-csrf examples',
};

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
