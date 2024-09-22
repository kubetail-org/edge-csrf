/**
 * Represents cookie options in config
 */
export class CookieOptions {
  domain: string = '';

  httpOnly: boolean = true;

  maxAge: number | undefined = undefined;

  name: string = '_csrfSecret';

  partitioned: boolean | undefined = undefined;

  path: string = '/';

  sameSite: boolean | 'none' | 'strict' | 'lax' = 'strict';

  secure: boolean = true;

  constructor(opts?: Partial<CookieOptions>) {
    Object.assign(this, opts);
  }
}

/**
 * Represents a function to retrieve token value from a request
 */
export type TokenValueFunction = {
  (request: Request): Promise<string>
};

/**
 * Represents token options in config
 */
export class TokenOptions {
  readonly fieldName: string = 'csrf_token';

  value: TokenValueFunction | undefined = undefined;

  _fieldNameRegex: RegExp;

  constructor(opts?: Partial<TokenOptions>) {
    Object.assign(this, opts);

    // create fieldname regex
    this._fieldNameRegex = new RegExp(`^(\\d+_)*${this.fieldName}$`);
  }
}

/**
 * Represents CsrfProtect configuration object
 */
export class Config {
  excludePathPrefixes: string[] = [];

  ignoreMethods: string[] = ['GET', 'HEAD', 'OPTIONS'];

  saltByteLength: number = 8;

  secretByteLength: number = 18;

  cookie: CookieOptions = new CookieOptions();

  token: TokenOptions = new TokenOptions();

  constructor(opts?: Partial<ConfigOptions>) {
    const newOpts = opts || {};
    if (newOpts.cookie) newOpts.cookie = new CookieOptions(newOpts.cookie);
    if (newOpts.token) newOpts.token = new TokenOptions(newOpts.token);
    Object.assign(this, newOpts);

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
