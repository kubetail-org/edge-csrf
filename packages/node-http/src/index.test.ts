import { createServer } from 'http';

import request from 'supertest';

import * as util from '@shared/util';

import { CsrfError, createCsrfProtect, NodeHttpConfig, NodeHttpTokenOptions } from './index';

function createApp() {
  const csrfProtect = createCsrfProtect();

  return createServer(async (req, res) => {
    // apply csrf protection
    try {
      await csrfProtect(req, res);
    } catch (err) {
      if (err instanceof CsrfError) {
        res.writeHead(403);
        res.end('invalid csrf token');
        return;
      }
      throw err;
    }

    if (req.url === '/' && ['GET', 'POST'].includes(req.method || '')) {
      res.writeHead(200);
      res.end('ok');
    } else {
      res.writeHead(404);
      res.end('not found');
    }
  });
}

describe('NodeHttpTokenOptions tests', () => {
  it('returns default values when options are absent', () => {
    const tokenOpts = new NodeHttpTokenOptions();
    expect(tokenOpts.responseHeader).toEqual('X-CSRF-Token');
  });

  it('handles overrides', () => {
    const tokenOpts = new NodeHttpTokenOptions({ responseHeader: 'XXX' });
    expect(tokenOpts.responseHeader).toEqual('XXX');
  });

  it('handles overrides of parent attributes', () => {
    const fn = async () => '';
    const tokenOpts = new NodeHttpTokenOptions({ value: fn });
    expect(tokenOpts.value).toBe(fn);
  });
});

describe('NodeHttpConfig tests', () => {
  it('returns default config when options are absent', () => {
    const config = new NodeHttpConfig();
    expect(config.excludePathPrefixes).toEqual([]);
    expect(config.token instanceof NodeHttpTokenOptions).toBe(true);
  });

  it('handles top-level overrides', () => {
    const config = new NodeHttpConfig({ excludePathPrefixes: ['/xxx/'] });
    expect(config.excludePathPrefixes).toEqual(['/xxx/']);
  });

  it('handles nested token overrides', () => {
    const config = new NodeHttpConfig({ token: { responseHeader: 'XXX' } });
    expect(config.token.responseHeader).toEqual('XXX');
  });
});

describe('csrfProtect integration tests', async () => {
  const testApp = createApp();

  it('adds token to response header', async () => {
    const resp = await request(testApp)
      .get('/')
      .expect(200);

    // assertions
    const token = resp.header['x-csrf-token'];
    expect(token).toBeDefined();
    expect(token).not.toBe('');
  });

  it('should work with application/json', async () => {
    const secretUint8 = util.createSecret(8);
    const tokenUint8 = await util.createToken(secretUint8, 8);

    const resp = await request(testApp)
      .post('/')
      .set('Content-Type', 'application/json')
      .set('Cookie', [`_csrfSecret=${util.utoa(secretUint8)}`])
      .send(JSON.stringify({ csrf_token: util.utoa(tokenUint8) }))
      .expect(200);

    // assertions
    const newTokenStr = resp.headers['x-csrf-token'];
    expect(newTokenStr).toBeDefined();
    expect(newTokenStr).not.toBe('');
  });

  it('should work with text/plain', async () => {
    const secretUint8 = util.createSecret(8);
    const tokenUint8 = await util.createToken(secretUint8, 8);

    const resp = await request(testApp)
      .post('/')
      .set('Content-Type', 'text/plain')
      .set('Cookie', [`_csrfSecret=${util.utoa(secretUint8)}`])
      .send(util.utoa(tokenUint8))
      .expect(200);

    // assertions
    const newTokenStr = resp.headers['x-csrf-token'];
    expect(newTokenStr).toBeDefined();
    expect(newTokenStr).not.toBe('');
  });

  it('should work with application/x-www-form-urlencoded', async () => {
    const secretUint8 = util.createSecret(8);
    const tokenUint8 = await util.createToken(secretUint8, 8);

    const resp = await request(testApp)
      .post('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Cookie', [`_csrfSecret=${util.utoa(secretUint8)}`])
      .send(`csrf_token=${encodeURIComponent(util.utoa(tokenUint8))}`)
      .expect(200);

    // assertions
    const newTokenStr = resp.headers['x-csrf-token'];
    expect(newTokenStr).toBeDefined();
    expect(newTokenStr).not.toBe('');
  });

  it('should work in x-csrf-token header', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const resp = await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${util.utoa(secret)}`])
      .set('X-CSRF-Token', util.utoa(token))
      .expect(200);

    // assertions
    const newTokenStr = resp.headers['x-csrf-token'];
    expect(newTokenStr).toBeDefined();
    expect(newTokenStr).not.toBe('');
  });

  it('should reject token from different secret', async () => {
    const goodSecret = util.createSecret(8);
    const evilSecret = util.createSecret(8);
    const evilToken = await util.createToken(evilSecret, 8);

    await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${util.utoa(goodSecret)}`])
      .set('X-CSRF-Token', util.utoa(evilToken))
      .expect(403);
  });

  it('should reject invalid token', async () => {
    const secret = util.createSecret(8);

    await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${util.utoa(secret)}`])
      .set('X-CSRF-Token', btoa(String.fromCharCode(100)))
      .expect(403);
  });

  it('should reject non-base64 token', async () => {
    const secret = util.createSecret(8);

    await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${util.utoa(secret)}`])
      .set('X-CSRF-Token', '-')
      .expect(403);
  });

  it('should reject no token', async () => {
    const secret = util.createSecret(8);

    await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${util.utoa(secret)}`])
      .expect(403);
  });

  it('should reject empty token', async () => {
    const secret = util.createSecret(8);

    await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${util.utoa(secret)}`])
      .set('X-CSRF-Token', '')
      .expect(403);
  });

  it('should reject with non-base64 secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    await request(testApp)
      .post('/')
      .set('Cookie', ['_csrfSecret=-'])
      .set('X-CSRF-Token', util.utoa(token))
      .expect(403);
  });

  it('should reject invalid secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    await request(testApp)
      .post('/')
      .set('Cookie', [`_csrfSecret=${btoa(String.fromCharCode(100))}`])
      .set('X-CSRF-Token', util.utoa(token))
      .expect(403);
  });

  it('should reject no secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    await request(testApp)
      .post('/')
      .set('X-CSRF-Token', util.utoa(token))
      .expect(403);
  });

  it('should reject empty secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    await request(testApp)
      .post('/')
      .set('Cookie', ['_csrfSecret='])
      .set('X-CSRF-Token', util.utoa(token))
      .expect(403);
  });
});

describe('obtaining secrets tests', () => {
  const testApp = createApp();

  describe('sets new secret when missing from request', () => {
    it('GET', async () => {
      const resp = await request(testApp).get('/');
      const setCookieList = resp.get('Set-Cookie');
      expect(setCookieList).not.toBeUndefined();
      if (!setCookieList) return;
      expect(setCookieList?.length).toEqual(1);
      expect(setCookieList[0].startsWith('_csrfSecret=')).toEqual(true);
    });

    it('POST', async () => {
      const resp = await request(testApp).post('/');
      const setCookieList = resp.get('Set-Cookie');
      expect(setCookieList).not.toBeUndefined();
      if (!setCookieList) return;
      expect(setCookieList?.length).toEqual(1);
      expect(setCookieList[0].startsWith('_csrfSecret=')).toEqual(true);
    });
  });

  describe('keeps existing secret when present in request', () => {
    const secretStr = util.utoa(util.createSecret(8));

    it('GET', async () => {
      const resp = await request(testApp)
        .get('/')
        .set('Cookie', [`_csrfSecret=${secretStr}`]);
      expect(resp.get('Set-Cookie')).toBeUndefined();
    });

    it('POST', async () => {
      const resp = await request(testApp)
        .post('/')
        .set('Cookie', [`_csrfSecret=${secretStr}`]);
      expect(resp.get('Set-Cookie')).toBeUndefined();
    });
  });

  it('creates unique secret on subsequent empty request', async () => {
    // 1st request
    const resp1 = await request(testApp).get('/');
    const setCookie1 = resp1.get('Set-Cookie');

    // 2nd request
    const resp2 = await request(testApp).get('/');
    const setCookie2 = resp2.get('Set-Cookie');

    // compare secrets
    expect(setCookie1).not.toEqual(undefined);
    expect(setCookie2).not.toEqual(undefined);
    if (!setCookie1 || !setCookie2) return;
    expect(setCookie1[0]).not.toEqual(setCookie2[0]);
  });
});
