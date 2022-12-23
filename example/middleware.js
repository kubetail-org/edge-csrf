import csrf from 'edge-csrf';
import { NextResponse } from 'next/server';

// initalize protection function
const csrfProtect = csrf({
  cookie: {
    secure: false  // WARNING: set this to `true` in production!
  }
});

export async function middleware(request) {
  const response = NextResponse.next();

  // csrf protection
  const csrfError = await csrfProtect(request, response);

  // check result
  if (csrfError) {
    return new NextResponse('invalid csrf token', { status: 403 });
  }
    
  return response;
}
