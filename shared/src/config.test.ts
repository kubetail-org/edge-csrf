import { Config, CookieOptions, TokenOptions } from './config';
import type { ConfigOptions } from './config';

describe('CookieOptions tests', () => {
  it('returns default values when options are absent', () => {
    const cookieOpts = new CookieOptions();
    expect(cookieOpts.domain).toEqual('');
    expect(cookieOpts.httpOnly).toEqual(true);
    expect(cookieOpts.maxAge).toEqual(undefined);
    expect(cookieOpts.name).toEqual('_csrfSecret');
    expect(cookieOpts.partitioned).toEqual(undefined);
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
    expect(tokenOpts.fieldName).toEqual('csrf_token');
    expect(tokenOpts.value).toEqual(undefined);
  });

  it('handles overrides', () => {
    const fn = async () => '';
    const tokenOpts = new TokenOptions({
      fieldName: 'csrfToken',
      value: fn,
    });
    expect(tokenOpts.fieldName).toEqual('csrfToken');
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
    const config = new Config({ token: { fieldName: 'csrfToken', value: fn } });
    expect(config.token.fieldName).toEqual('csrfToken');
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
