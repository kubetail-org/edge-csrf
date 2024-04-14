import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Config } from './config';
import type { ConfigOptions } from './config';
import {
  createSecret,
  getTokenString,
  createToken,
  verifyToken,
  utoa,
  atou,
} from './util';

export type HandlerFunction = {
  (request: NextRequest, response: NextResponse): Promise<Error | null>;
};

/**
 * Create handler function for use in Next.js middleware
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns Handler function
 */
export function createHandler(opts?: Partial<ConfigOptions>): HandlerFunction {
  const config = new Config(opts || {});

  return async (request, response) => {
    // check excludePathPrefixes
    for (const pathPrefix of config.excludePathPrefixes) {
      if (request.nextUrl.pathname.startsWith(pathPrefix)) return null;
    }

    // get secret from cookies
    const secretStr = request.cookies.get(config.cookie.name)?.value;

    let secret: Uint8Array;

    // if secret is missing, create new secret and set cookie
    if (secretStr === undefined) {
      secret = createSecret(config.secretByteLength);
      const cookie = { ...config.cookie, value: utoa(secret) };
      response.cookies.set(cookie);
    } else {
      secret = atou(secretStr);
    }

    // verify token
    if (!config.ignoreMethods.includes(request.method)) {
      const tokenStr = await getTokenString(request, config.token.value);

      if (!await verifyToken(atou(tokenStr), secret)) {
        return new Error('csrf validation error');
      }
    }

    // create new token for response
    const newToken = await createToken(secret, config.saltByteLength);
    response.headers.set(config.token.responseHeader, utoa(newToken));

    return null;
  };
}

/**
 * Create Next.js middleware function
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns Next Middleware function
 */
export function createMiddleware(opts?: Partial<ConfigOptions>) {
  const csrfHandler = createHandler(opts);

  return async (request: NextRequest) => {
    const response = NextResponse.next();

    // csrf protection
    const csrfError = await csrfHandler(request, response);

    // check result
    if (csrfError) {
      return new NextResponse('invalid csrf token', { status: 403 });
    }

    return response;
  };
}
