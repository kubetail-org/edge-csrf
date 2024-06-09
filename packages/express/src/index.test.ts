import express from 'express';
import type { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import request from 'supertest';

import * as util from '@shared/util';

import { CsrfError, ExpressConfig, ExpressTokenOptions, createCsrfProtect, createCsrfMiddleware } from './index';

describe('NextTokenOptions tests', () => {
  it('returns default values when options are absent', () => {
    const tokenOpts = new ExpressTokenOptions();
    expect(tokenOpts.responseHeader).toEqual('X-CSRF-Token');
  });

  it('handles overrides', () => {
    const tokenOpts = new ExpressTokenOptions({ responseHeader: 'XXX' });
    expect(tokenOpts.responseHeader).toEqual('XXX');
  });

  it('handles overrides of parent attributes', () => {
    const fn = async () => '';
    const tokenOpts = new ExpressTokenOptions({ value: fn });
    expect(tokenOpts.value).toBe(fn);
  });
});

describe('NextConfig tests', () => {
  it('returns default config when options are absent', () => {
    const config = new ExpressConfig();
    expect(config.excludePathPrefixes).toEqual([]);
    expect(config.token instanceof ExpressTokenOptions).toBe(true);
  });

  it('handles top-level overrides', () => {
    const config = new ExpressConfig({ excludePathPrefixes: ['/xxx/'] });
    expect(config.excludePathPrefixes).toEqual(['/xxx/']);
  });

  it('handles nested token overrides', () => {
    const config = new ExpressConfig({ token: { responseHeader: 'XXX' } });
    expect(config.token.responseHeader).toEqual('XXX');
  });
});

describe('csrfProtectMiddleware integration tests', () => {
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

  it('should work in req.body', async () => {
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

  /*
  it('should handle server action form submissions', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const formData = new FormData();
    formData.set('csrf_token', util.utoa(token));
    formData.set('key1', 'val1');

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      body: formData,
    });
    request.cookies.set('_csrfSecret', util.utoa(secret));

    const response = NextResponse.next();
    await csrfProtectDefault(request, response);

    // assertions
    const newTokenStr = response.headers.get('X-CSRF-Token');
    expect(newTokenStr).toBeDefined();
    expect(newTokenStr).not.toBe('');
  });

  it('should handle server action non-form submissions', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify([util.utoa(token), 'arg']),
    });
    request.cookies.set('_csrfSecret', util.utoa(secret));

    const response = NextResponse.next();
    await csrfProtectDefault(request, response);

    // assertions
    const newTokenStr = response.headers.get('X-CSRF-Token');
    expect(newTokenStr).toBeDefined();
    expect(newTokenStr).not.toBe('');
  });

  it('should fail with token from different secret', async () => {
    const evilSecret = util.createSecret(8);
    const goodSecret = util.createSecret(8);
    const token = await util.createToken(evilSecret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    request.cookies.set('_csrfSecret', util.utoa(goodSecret));

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with an invalid token', async () => {
    const secret = util.createSecret(8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': btoa(String.fromCharCode(100)) },
    });
    request.cookies.set('_csrfSecret', util.utoa(secret));

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with non-base64 token', async () => {
    const secret = util.createSecret(8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': '-' },
    });
    request.cookies.set('_csrfSecret', util.utoa(secret));

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with no token', async () => {
    const secret = util.createSecret(8);

    const request = new NextRequest('http://example.com', { method: 'POST' });
    request.cookies.set('_csrfSecret', util.utoa(secret));

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with empty token', async () => {
    const secret = util.createSecret(8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': '' },
    });
    request.cookies.set('_csrfSecret', util.utoa(secret));

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with non-base64 secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    request.cookies.set('_csrfSecret', '-');

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with an invalid secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    request.cookies.set('_csrfSecret', btoa(String.fromCharCode(100)));

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with no secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });

  it('should fail with empty secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    request.cookies.set('_csrfSecret', '');

    const response = NextResponse.next();
    await expect(csrfProtectDefault(request, response)).rejects.toThrow(CsrfError);
  });
  */
});

/*
describe('obtaining secrets tests', () => {
  const csrfProtectDefault = createCsrfProtect();

  describe('sets new secret when missing from request', () => {
    const methods = ['GET', 'POST'];

    it.each(methods)('%s request', async (method) => {
      const request = new NextRequest('http://example.com', { method });
      const response = NextResponse.next();

      try {
        await csrfProtectDefault(request, response);
      } catch (err) {
        // do nothing
      }

      expect(response.cookies.get('_csrfSecret')).not.toEqual(undefined);
    });
  });

  describe('keeps existing secret when present in request', () => {
    const methods = ['GET', 'POST'];
    const secretStr = util.utoa(util.createSecret(8));

    it.each(methods)('%s request', async (method) => {
      const request = new NextRequest('http://example.com', { method });
      request.cookies.set('_csrfSecret', secretStr);
      const response = NextResponse.next();

      try {
        await csrfProtectDefault(request, response);
      } catch (err) {
        // do nothing
      }

      expect(response.cookies.get('_csrfSecret')).toEqual(undefined);
    });
  });

  it('creates unique secret on subsequent empty request', async () => {
    const request = new NextRequest('http://example.com', {
      method: 'GET',
    });

    // 1st request
    const response1 = NextResponse.next();
    await csrfProtectDefault(request, response1);
    const secret1 = response1.cookies.get('_csrfSecret');

    // 2nd request
    const response2 = NextResponse.next();
    await csrfProtectDefault(request, response2);
    const secret2 = response2.cookies.get('_csrfSecret');

    // compare secrets
    expect(secret1).not.toEqual(undefined);
    expect(secret2).not.toEqual(undefined);
    expect(secret1).not.toEqual(secret2);
  });
});
*/

function createApp(): Express {  
  const app = express();
  app.use(express.urlencoded({ extended: false }));

  const csrfMiddleware = createCsrfMiddleware();
  app.use(csrfMiddleware)

  app.get('/', function(_, res) {
    res.status(200).json({ 'success': true });
  });

  app.post('/', function(_, res) {
    res.status(200).json({ 'success': true });
  });

  return app;
}
