import { CsrfError, createCsrfProtect } from '@edge-csrf/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // csrf protection
  try {
    await csrfProtect(request, response);
  } catch (err) {
    if (err instanceof CsrfError) return new NextResponse('invalid csrf token', { status: 403 });
    throw err;
  }

  // return token (for use in static-optimized-example)
  if (request.nextUrl.pathname === '/csrf-token') {
    return NextResponse.json({ csrfToken: response.headers.get('X-CSRF-Token') || 'missing' });
  }

  return response;
}
