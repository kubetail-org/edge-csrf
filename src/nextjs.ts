import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Config } from '@/lib/config';
import type { ConfigOptions } from '@/lib/config';
import { CsrfError } from '@/lib/errors';
import { createCsrfProtect as _createCsrfProtect } from '@/lib/protect';

/**
 * Represents signature of CSRF protect function to be used in Next.js middleware
 */
export type NextCsrfProtectFunction = {
  (request: NextRequest, response: NextResponse): Promise<void>;
};

/**
 * Create CSRF protection function for use in Next.js middleware
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns {NextCsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<ConfigOptions>): NextCsrfProtectFunction {
  const config = new Config(opts);
  const _csrfProtect = _createCsrfProtect(config);

  return async (request, response) => {
    // execute protect function
    const token = await _csrfProtect({
      request: request,
      url: request.nextUrl,
      getCookie: (name) => request.cookies.get(name)?.value,
      setCookie: (cookie) => response.cookies.set(cookie),
    });

    // add token to response header
    if (token) response.headers.set(config.token.responseHeader, token);
  };
}

//export function createCsrfProtect(opts?: Partial<ConfigOptions>): NextCsrfProtectFunction {
//  const config = new Config(opts || {});
//
//  return async (request, response) => {
//    // check excludePathPrefixes
//    for (const pathPrefix of config.excludePathPrefixes) {
//      if (request.nextUrl.pathname.startsWith(pathPrefix)) return;
//    }
//
//    // get secret from cookies
//    const secretStr = request.cookies.get(config.cookie.name)?.value;
//
//    let secret: Uint8Array;
//
//    // if secret is missing, create new secret and set cookie
//    if (secretStr === undefined) {
//      secret = createSecret(config.secretByteLength);
//      const cookie = { ...config.cookie, value: utoa(secret) };
//      response.cookies.set(cookie);
//    } else {
//      secret = atou(secretStr);
//    }
//
//    // verify token
//    if (!config.ignoreMethods.includes(request.method)) {
//      const tokenStr = await getTokenString(request, config.token.value);
//
//      if (!await verifyToken(atou(tokenStr), secret)) {
//        throw new CsrfError('csrf validation error');
//      }
//    }
//
//    // create new token for response
//    const newToken = await createToken(secret, config.saltByteLength);
//    response.headers.set(config.token.responseHeader, utoa(newToken));
//
//    return;
//  };
//}

/**
 * Create Next.js middleware function
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns Next Middleware function
 */
export function createMiddleware(opts?: Partial<ConfigOptions>) {
  const csrfProtect = createCsrfProtect(opts);

  return async (request: NextRequest) => {
    const response = NextResponse.next();

    // csrf protection
    try {
      await csrfProtect(request, response);
    } catch (err) {
      if (err instanceof CsrfError) return new NextResponse('invalid csrf token', { status: 403 });
      throw err;
    }

    return response;
  };
}
