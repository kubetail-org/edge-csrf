import { Config } from './config';
import type { ConfigOptions, CookieOptions } from './config';
import { createSecret, createToken, getTokenString, verifyToken, atou, utoa } from './util';

/**
 * Represents a generic CSRF protection error
 */
export class CsrfError extends Error {}

/**
 * Represents a cookie
 */
export type Cookie = CookieOptions & { value: string; };

/**
 * Represents arguments for CsrfProtectionFunction
 */
export type CsrfProtectArgs = {
  request: Request,
  url: { pathname: string; },
  getCookie: (name: string) => string | undefined;
  setCookie: (cookie: Cookie) => void;
};

/**
 * Represents signature of CSRF protect function
 */
export type CsrfProtect = {
  (args: CsrfProtectArgs): Promise<string | undefined>;
};

/**
 * Create CSRF protection function
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns {CsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<ConfigOptions>): CsrfProtect {
  const config = new Config(opts || {});

  return async (args) => {
    const { request, url, getCookie, setCookie } = args;

    // check excludePathPrefixes
    for (const pathPrefix of config.excludePathPrefixes) {
      if (url.pathname.startsWith(pathPrefix)) return undefined;
    }

    // get secret from cookies
    const secretStr = getCookie(config.cookie.name);

    let secret: Uint8Array;

    // if secret is missing, create new secret and set cookie
    if (secretStr === undefined) {
      secret = createSecret(config.secretByteLength);
      setCookie({ ...config.cookie, value: utoa(secret) });
    } else {
      secret = atou(secretStr);
    }

    // verify token
    if (!config.ignoreMethods.includes(request.method)) {
      const tokenStr = await getTokenString(request, config.token);
      if (!await verifyToken(atou(tokenStr), secret)) {
        throw new CsrfError('csrf validation error');
      }
    }

    // create new token for response
    const newToken = await createToken(secret, config.saltByteLength);
    return utoa(newToken);
  };
}
