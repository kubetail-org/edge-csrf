import { CsrfError } from '@/lib/errors';
import { Config } from '@/lib/config';
import type { CookieOptions, ConfigOptions } from '@/lib/config';
import { createSecret, createToken, getTokenString, verifyToken, atou, utoa } from '@/lib/util';

/**
 * Represents a cookie instance
 */
export type Cookie  = CookieOptions & { value: string; };

/**
 * Represents arguments for CsrfProtectionFunction
 */
export type CsrfProtectFunctionArgs = {
  request: Request;
  url: { pathname: string; },
  getCookie: (name: string) => string | undefined;
  setCookie: (cookie: CookieOptions & { value: string; } ) => void;
};

/**
 * Represents signature of CSRF protect function
 */
export type CsrfProtectFunction = {
  (args: CsrfProtectFunctionArgs): Promise<string | undefined>;
};

/**
 * Create CSRF protection function
 * @param {Partial<ConfigOptions>} opts - Configuration options
 * @returns {CsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<ConfigOptions>): CsrfProtectFunction {
  const config = new Config(opts || {});

  return async (args) => {
    const { request, url, getCookie, setCookie } = args;

    // check excludePathPrefixes
    for (const pathPrefix of config.excludePathPrefixes) {
      if (url.pathname.startsWith(pathPrefix)) return;
    }

    // get secret from cookies
    const secretStr = getCookie(config.cookie.name);

    let secret: Uint8Array;

    // if secret is missing, create new secret and set cookie
    if (secretStr === undefined) {
      secret = createSecret(config.secretByteLength);
      const cookie = { ...config.cookie, value: utoa(secret) };
      setCookie(cookie);
    } else {
      secret = atou(secretStr);
    }

    // verify token
    if (!config.ignoreMethods.includes(request.method)) {
      const tokenStr = await getTokenString(request, config.token.value);

      if (!await verifyToken(atou(tokenStr), secret)) {
        throw new CsrfError('csrf validation error');
      }
    }

    // create new token for response
    const newToken = await createToken(secret, config.saltByteLength);
    return utoa(newToken);
  };
}
