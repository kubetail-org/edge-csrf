import type { NextRequest } from 'next/server';

import type { TokenValueFunction } from './util';

export class CookieOptions {
  domain: string = ''
  httpOnly: boolean = true
  maxAge: number | undefined = undefined
  name: string = '_csrfSecret'
  path: string = '/'
  sameSite: boolean | 'none' | 'strict' | 'lax' = 'strict'
  secure: boolean = true
  
  constructor(opts?: Partial<CookieOptions>) {
    Object.assign(this, opts);
  }
}

export class TokenOptions {
  responseHeader: string = 'X-CSRF-Token'
  value: TokenValueFunction | undefined = undefined
  
  constructor(opts?: Partial<TokenOptions>) {
    Object.assign(this, opts);
  }
}

export class Config {
  cookie: CookieOptions = new CookieOptions()
  excludePathPrefixes: string[] = ['/_next/']
  ignoreMethods: string[] = ['GET', 'HEAD', 'OPTIONS']
  saltByteLength: number = 8
  secretByteLength: number = 18
  token: TokenOptions = new TokenOptions()
  
  constructor(opts?: Partial<ConfigOptions>) {
    opts = opts || {}
    if (opts.cookie) opts.cookie = new CookieOptions(opts.cookie);
    if (opts.token) opts.token = new TokenOptions(opts.token);
    Object.assign(this, opts)

    // basic validation
    if (this.saltByteLength < 1 || this.saltByteLength > 255) {
      throw Error('saltBytLength must be greater than 0 and less than 256')
    }

    if (this.secretByteLength < 1 || this.secretByteLength > 255) {
      throw Error('secretBytLength must be greater than 0 and less than 256')
    }
  }
}

export interface ConfigOptions extends Omit<Config, 'cookie' | 'token'> {
  cookie: Partial<CookieOptions>;
  token: Partial<TokenOptions>;
};
