import { vi } from 'vitest';

import { Config, CookieOptions, CsrfProtectError, TokenOptions, createCsrfProtect } from './protect';
import type { ConfigOptions, Cookie, CsrfProtectArgs } from './protect';
import * as util from './util';

describe('CookieOptions tests', () => {
  it('returns default values when options are absent', () => {
    const cookieOpts = new CookieOptions();
    expect(cookieOpts.domain).toEqual('');
    expect(cookieOpts.httpOnly).toEqual(true);
    expect(cookieOpts.maxAge).toEqual(undefined);
    expect(cookieOpts.name).toEqual('_csrfSecret');
    expect(cookieOpts.path).toEqual('/');
    expect(cookieOpts.sameSite).toEqual('strict');
    expect(cookieOpts.secure).toEqual(true);
  });

  it('handles overrides', () => {
    const cookieOpts = new CookieOptions({ domain: 'xxx' });
    expect(cookieOpts.domain).toEqual('xxx');
  });
});

describe('TokenOptions tests', () => {
  it('returns default values when options are absent', () => {
    const tokenOpts = new TokenOptions();
    expect(tokenOpts.value).toEqual(undefined);
  });

  it('handles overrides', () => {
    const fn = async () => '';
    const tokenOpts = new TokenOptions({ value: fn });
    expect(tokenOpts.value).toBe(fn);
  });
});

describe('Config tests', () => {
  const initConfigFn = (opts: Partial<ConfigOptions>) => () => new Config(opts);

  it('returns default config when options are absent', () => {
    const config = new Config();
    expect(config.excludePathPrefixes).toEqual([]);
    expect(config.ignoreMethods).toEqual(['GET', 'HEAD', 'OPTIONS']);
    expect(config.saltByteLength).toEqual(8);
    expect(config.secretByteLength).toEqual(18);
    expect(config.cookie instanceof CookieOptions).toBe(true);
    expect(config.token instanceof TokenOptions).toBe(true);
  });

  it('handles top-level overrides', () => {
    const config = new Config({ saltByteLength: 10 });
    expect(config.saltByteLength).toEqual(10);
  });

  it('handles nested cookie overrides', () => {
    const config = new Config({ cookie: { domain: 'xxx' } });
    expect(config.cookie.domain).toEqual('xxx');
  });

  it('handles nested token overrides', () => {
    const fn = async () => '';
    const config = new Config({ token: { value: fn } });
    expect(config.token.value).toBe(fn);
  });

  it('saltByteLength must be greater than 0', () => {
    expect(initConfigFn({ saltByteLength: 0 })).toThrow(Error);
    expect(initConfigFn({ saltByteLength: 1 })).not.toThrow(Error);
  });

  it('saltByteLength must be less than 256', () => {
    expect(initConfigFn({ saltByteLength: 256 })).toThrow(Error);
    expect(initConfigFn({ saltByteLength: 255 })).not.toThrow(Error);
  });

  it('secretByteLength must be greater than 0', () => {
    expect(initConfigFn({ secretByteLength: 0 })).toThrow(Error);
    expect(initConfigFn({ secretByteLength: 1 })).not.toThrow(Error);
  });

  it('secretByteLength must be less than 256', () => {
    expect(initConfigFn({ secretByteLength: 256 })).toThrow(Error);
    expect(initConfigFn({ secretByteLength: 255 })).not.toThrow(Error);
  });
});

describe('csrfProtect tests', () => {
  let createSecretMock = vi.spyOn(util, 'createSecret');
  let getTokenStringMock = vi.spyOn(util, 'getTokenString');
  let verifyTokenMock = vi.spyOn(util, 'verifyToken');
  let createTokenMock = vi.spyOn(util, 'createToken');

  beforeEach(() => {
    createSecretMock = vi.spyOn(util, 'createSecret');
    getTokenStringMock = vi.spyOn(util, 'getTokenString');
    verifyTokenMock = vi.spyOn(util, 'verifyToken');
    createTokenMock = vi.spyOn(util, 'createToken');
  });

  afterEach(() => {
    createSecretMock.mockRestore();
    getTokenStringMock.mockRestore();
    verifyTokenMock.mockRestore();
    createTokenMock.mockRestore();
  });

  /**
   * Helper class
   */
  class TestArgs implements CsrfProtectArgs {
    request: CsrfProtectArgs['request'];

    url: CsrfProtectArgs['url'];

    getCookie: CsrfProtectArgs['getCookie'] = vi.fn();

    setCookie: CsrfProtectArgs['setCookie'] = vi.fn();

    constructor(url: string = 'http://example.com/', requestArgs?: RequestInit) {
      this.request = new Request(url, requestArgs);
      this.url = new URL(url);
    }
  }

  describe('exits early when pathname in `excludePathPrefixes`', async () => {
    const csrfProtect = createCsrfProtect({
      excludePathPrefixes: ['/test-path1/', '/test-path2/'],
    });

    const urls = [
      'http://example.com/test-path1/xxx',
      'http://example.com/test-path2/xxx',
    ];

    it.each(urls)('%s', async (url) => {
      const args = new TestArgs(url);
      const token = await csrfProtect(args);
      expect(token).toEqual(undefined);
      expect(args.getCookie).toHaveBeenCalledTimes(0);
    });
  });

  it('calls getCookie() with configured cookie name', async () => {
    const csrfProtect = createCsrfProtect({ cookie: { name: 'xxx' } });

    const args = new TestArgs();
    await csrfProtect(args);

    expect(args.getCookie).toHaveBeenCalledOnce();
    expect(args.getCookie).toHaveBeenCalledWith('xxx');
  });

  it('calls setCookie() with new cookie values', async () => {
    const csrfProtect = createCsrfProtect();

    const args = new TestArgs();
    args.setCookie = vi.fn().mockImplementation((cookie: Cookie) => {
      const { value, ...other } = cookie;
      expect(other).toEqual(new CookieOptions());
      expect(value).toBeDefined();
      expect(value).toEqual(expect.any(String));
      expect(value).not.toBe('');
    });

    await csrfProtect(args);
    expect(args.setCookie).toHaveBeenCalledOnce();
  });

  it('doesnt call setCookie() if cookie already defined', async () => {
    const csrfProtect = createCsrfProtect();

    const args = new TestArgs();
    args.getCookie = vi.fn().mockReturnValue('xxx');

    await csrfProtect(args);
    expect(args.getCookie).toHaveBeenCalledOnce();
    expect(args.setCookie).toHaveBeenCalledTimes(0);
  });

  it('uses createSecret() to create new secrets', async () => {
    const csrfProtect = createCsrfProtect();

    // add spy hooks
    const secret = new Uint8Array([0, 0, 0]);
    vi.spyOn(util, 'createSecret').mockReturnValue(secret);

    const args = new TestArgs();
    args.setCookie = vi.fn().mockImplementation((cookie: Cookie) => {
      expect(cookie.value).toEqual(util.utoa(secret));
    });

    // execute
    await csrfProtect(args);
    expect(args.setCookie).toHaveBeenCalledOnce();
  });

  describe('skips verification if method in `ignoreMethods`', () => {
    const config = new Config();

    it.each(config.ignoreMethods)('%s request', async (method) => {
      const csrfProtect = createCsrfProtect();
      const args = new TestArgs('http://example.com/', { method });
      await csrfProtect(args);

      // assertions
      expect(getTokenStringMock).toHaveBeenCalledTimes(0);
      expect(verifyTokenMock).toHaveBeenCalledTimes(0);
    });
  });

  it('calls verifyToken() with return values of getCookie() and getTokenString()', async () => {
    const secretUint8 = new Uint8Array([0, 0, 0]);
    const tokenStr = 'xxx';

    const args = new TestArgs('http://example.com/', { method: 'POST' });

    // set up mocks
    args.getCookie = vi.fn().mockReturnValue(util.utoa(secretUint8));

    getTokenStringMock = vi.spyOn(util, 'getTokenString').mockResolvedValue(tokenStr);

    verifyTokenMock = vi.spyOn(util, 'verifyToken').mockImplementation(async (token, secret) => {
      expect(token).toEqual(util.atou(tokenStr));
      expect(secret).toEqual(secretUint8);
      return true;
    });

    // execute method
    const csrfProtect = createCsrfProtect();
    await csrfProtect(args);

    // assertions
    expect(getTokenStringMock).toHaveBeenCalledOnce();
    expect(verifyTokenMock).toHaveBeenCalledOnce();
  });

  it('raises CsrfProtectError when verifyToken() returns false', async () => {
    verifyTokenMock = vi.spyOn(util, 'verifyToken').mockResolvedValue(false);

    const args = new TestArgs('http://example.com/', { method: 'POST' });
    const csrfProtect = createCsrfProtect();
    await expect(csrfProtect(args)).rejects.toThrow(CsrfProtectError);
    expect(verifyTokenMock).toHaveBeenCalledOnce();
  });

  it('calls createToken() with secret from cookie and configured `saltByteLength`', async () => {
    const secretStr = 'xxx';
    const saltByteLength = 13;

    const args = new TestArgs();
    const csrfProtect = createCsrfProtect({ saltByteLength });

    // set up mocks
    args.getCookie = vi.fn().mockReturnValue(secretStr);

    createTokenMock = vi.spyOn(util, 'createToken').mockImplementation(async (secret, length) => {
      expect(secret).toEqual(util.atou(secretStr));
      expect(length).toEqual(saltByteLength);
      return new Uint8Array([0, 0, 0]);
    });

    await csrfProtect(args);

    // assertions
    expect(args.getCookie).toHaveBeenCalledTimes(1);
    expect(createTokenMock).toHaveBeenCalledTimes(1);
  });

  it('returns result of createToken()', async () => {
    const tokenUint8 = new Uint8Array([0, 0, 0]);

    // set up mocks
    createTokenMock = vi.spyOn(util, 'createToken').mockResolvedValue(tokenUint8);

    // execute
    const csrfProtect = createCsrfProtect();
    const token = await csrfProtect(new TestArgs());

    // assertions
    expect(createTokenMock).toHaveBeenCalledTimes(1);
    expect(token).toEqual(util.utoa(tokenUint8));
  });
});
