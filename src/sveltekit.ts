import type { Handle, RequestEvent } from '@sveltejs/kit';

import type { ConfigOptions } from '@/lib/config';
import { CsrfError } from '@/lib/errors';
import { createCsrfProtect as _createCsrfProtect } from '@/lib/protect';

/**
 * Represents locals added to Svelte by Edge-CSRF
 */
export interface EdgeCsrfLocals {
  csrfToken?: string;
}

/**
 * Represents signature of CSRF protect function to be used in SvelteKit handle
 */
export type SveltekitCsrfProtectFunction = {
  (request: RequestEvent): Promise<void>;
};

/**
 * Create CSRF protection function for use in a SvelteKit handle
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns {SveltekitCsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<ConfigOptions>): SveltekitCsrfProtectFunction {
  const _csrfProtect = _createCsrfProtect(opts);

  return async (event) => {
    // execute protect function
    const token = await _csrfProtect({
      request: event.request,
      url: event.url,
      getCookie: (name) => event.cookies.get(name)?.valueOf(),
      setCookie: (cookie) => event.cookies.set(cookie.name, cookie.value, cookie),
    });

    // add token to locals
    if (token) Object.assign(event.locals, { csrfToken: token });
  };
}

//export function createCsrfProtect(opts?: Partial<ConfigOptions>): SveltekitCsrfProtectFunction {
//  const config = new Config(opts || {});
//
//  return async (event) => {
//    // check excludePathPrefixes
//    for (const pathPrefix of config.excludePathPrefixes) {
//      if (event.url.pathname.startsWith(pathPrefix)) return;
//    }
//
//    // get secret from cookies
//    const secretStr = event.cookies.get(config.cookie.name)?.valueOf();
//
//    let secret: Uint8Array;
//
//    // if secret is missing, create new secret and set cookie
//    if (secretStr === undefined) {
//      secret = createSecret(config.secretByteLength);
//      event.cookies.set(config.cookie.name, utoa(secret), config.cookie);
//    } else {
//      secret = atou(secretStr);
//    }
//
//    // verify token
//    if (!config.ignoreMethods.includes(event.request.method)) {
//      const tokenStr = await getTokenString(event.request, config.token.value);
//
//      if (!await verifyToken(atou(tokenStr), secret)) {
//        throw new CsrfError('csrf validation error');
//      }
//    }
//
//    // create new token for response
//    const newToken = await createToken(secret, config.saltByteLength);
//    Object.assign(event.locals, { csrfToken: utoa(newToken) });
//
//    // resolve event
//    return;
//  };
//}

/**
 * Create SvelteKit handle
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns {Handle} The SvelteKit handle
 */
export function createHandle(opts?: Partial<ConfigOptions>): Handle {
  const csrfProtect = createCsrfProtect(opts);

  return async ({ event, resolve }) => {
    try {
      await csrfProtect(event);
    } catch (err) {
      if (err instanceof CsrfError) return new Response('invalid csrf token', { status: 403 });
      throw err;
    }

    return resolve(event);
  };
}
