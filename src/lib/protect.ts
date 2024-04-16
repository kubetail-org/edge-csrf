import { CsrfError } from '@/lib/errors';
import { createSecret, createToken, getTokenString, verifyToken, atou, utoa } from '@/lib/util';
import type { TokenValueFunction } from '@/lib/util';

export class CookieOptions {
  domain: string = '';

  httpOnly: boolean = true;

  maxAge: number | undefined = undefined;

  name: string = '_csrfSecret';

  path: string = '/';

  sameSite: boolean | 'none' | 'strict' | 'lax' = 'strict';

  secure: boolean = true;

  constructor(opts?: Partial<CookieOptions>) {
    Object.assign(this, opts);
  }
}

export class TokenOptions {
  value: TokenValueFunction | undefined = undefined;

  constructor(opts?: Partial<TokenOptions>) {
    Object.assign(this, opts);
  }
}

/**
 * Represents CsrfProtect configuration object
 */
export class Config {
  cookie: CookieOptions = new CookieOptions();

  excludePathPrefixes: string[] = [];

  ignoreMethods: string[] = ['GET', 'HEAD', 'OPTIONS'];

  saltByteLength: number = 8;

  secretByteLength: number = 18;

  token: TokenOptions = new TokenOptions();

  constructor(opts?: Partial<ConfigOptions>) {
    const newOpts = opts || {};
    if (newOpts.cookie) newOpts.cookie = new CookieOptions(newOpts.cookie);
    if (newOpts.token) newOpts.token = new TokenOptions(newOpts.token);
    Object.assign(this, opts);

    // basic validation
    if (this.saltByteLength < 1 || this.saltByteLength > 255) {
      throw Error('saltBytLength must be greater than 0 and less than 256');
    }

    if (this.secretByteLength < 1 || this.secretByteLength > 255) {
      throw Error('secretBytLength must be greater than 0 and less than 256');
    }
  }
}

/**
 * Represents CsrfProtect configuration options object
 */
export interface ConfigOptions extends Omit<Config, 'cookie' | 'token'> {
  cookie: Partial<CookieOptions>;
  token: Partial<TokenOptions>;
}

/**
 * Represents a cookie
 */
export type Cookie = CookieOptions & { value: string; };

/**
 * Represents arguments for CsrfProtectionFunction
 */
export type CsrfProtectArgs = {
  request: Request;
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
      if (url.pathname.startsWith(pathPrefix)) return;
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
