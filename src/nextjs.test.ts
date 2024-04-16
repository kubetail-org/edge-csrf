import { NextRequest, NextResponse } from 'next/server';

import { createCsrfProtect } from '@/nextjs';
import { createSecret, createToken, utoa, atou } from '@/lib/util';

const csrfProtectDefault = createCsrfProtect();

describe('csrfProtect tests', () => {
  it('should work in req.body', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `csrf_token=${encodeURIComponent(utoa(token))}`,
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toEqual(null);
  });

  it('should work in x-csrf-token header', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': utoa(token) },
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toEqual(null);
  });

  it('should handle server action form submissions', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const formData = new FormData();
    formData.set('csrf_token', utoa(token));
    formData.set('key1', 'val1');

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      body: formData,
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toEqual(null);
  });

  it('should handle server action non-form submissions', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify([utoa(token), 'arg']),
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toEqual(null);
  });

  it('should fail with token from different secret', async () => {
    const evilSecret = createSecret(8);
    const goodSecret = createSecret(8);
    const token = await createToken(evilSecret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': utoa(token) },
    });
    request.cookies.set('_csrfSecret', utoa(goodSecret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with an invalid token', async () => {
    const secret = createSecret(8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': btoa(String.fromCharCode(100)) },
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with non-base64 token', async () => {
    const secret = createSecret(8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': '-' },
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with no token', async () => {
    const secret = createSecret(8);

    const request = new NextRequest('http://example.com', { method: 'POST' });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with empty token', async () => {
    const secret = createSecret(8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': '' },
    });
    request.cookies.set('_csrfSecret', utoa(secret));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with non-base64 secret', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': utoa(token) },
    });
    request.cookies.set('_csrfSecret', '-');

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with an invalid secret', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': utoa(token) },
    });
    request.cookies.set('_csrfSecret', btoa(String.fromCharCode(100)));

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with no secret', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': utoa(token) },
    });

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });

  it('should fail with empty secret', async () => {
    const secret = createSecret(8);
    const token = await createToken(secret, 8);

    const request = new NextRequest('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': utoa(token) },
    });
    request.cookies.set('_csrfSecret', '');

    const response = NextResponse.next();
    const csrfError = await csrfProtectDefault(request, response);

    // assertions
    expect(csrfError).toBeInstanceOf(Error);
  });
});

describe('obtaining secrets tests', () => {
  describe('sets new secret when missing from request', () => {
    const methods = ['GET', 'POST'];

    it.each(methods)('%s request', async (method) => {
      const request = new NextRequest('http://example.com', { method });
      const response = NextResponse.next();
      await csrfProtectDefault(request, response);
      expect(response.cookies.get('_csrfSecret')).not.toEqual(undefined);
    });
  });

  describe('keeps existing secret when present in request', () => {
    const methods = ['GET', 'POST'];
    const secretStr = utoa(createSecret(8));

    it.each(methods)('%s request', async (method) => {
      const request = new NextRequest('http://example.com', { method });
      request.cookies.set('_csrfSecret', secretStr);
      const response = NextResponse.next();
      await csrfProtectDefault(request, response);
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

describe('config option tests', () => {
  describe('cookie', () => {
    it('should respect configured `domain`', async () => {
      const csrfProtect = createCsrfProtect({ cookie: { domain: 'x.example.com' } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const cookie = response.cookies.get('_csrfSecret')!;

      // assertions
      expect(cookie.domain).toEqual('x.example.com');
    });

    it.each([true, false])('should respect `httpOnly:%s`', async (httpOnly) => {
      const csrfProtect = createCsrfProtect({ cookie: { httpOnly } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const setCookie = response.headers.get('set-cookie');

      // assertions
      expect(setCookie?.includes('HttpOnly')).toEqual(httpOnly);
    });

    it('should use session cookies by default', async () => {
      const csrfProtect = createCsrfProtect();

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const cookie = response.cookies.get('_csrfSecret')!;
      const setCookie = response.headers.get('set-cookie') || '';

      // assertions
      expect(cookie.maxAge).toEqual(undefined);
      expect(cookie.expires).toEqual(undefined);
      expect(setCookie.includes('Max-Age')).toEqual(false);
      expect(setCookie.includes('Expires')).toEqual(false);
    });

    it('should respect configured `maxAge`', async () => {
      const csrfProtect = createCsrfProtect({ cookie: { maxAge: 60 * 60 * 24 } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const cookie = response.cookies.get('_csrfSecret')!;

      // assertions
      expect(cookie.maxAge).toEqual(86400);
      expect(cookie.expires).not.toEqual(undefined);
    });

    it('should respect configured `name`', async () => {
      const csrfProtect = createCsrfProtect({ cookie: { name: 'customName' } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);

      // assertions
      expect(response.cookies.get('customName')).not.toEqual(undefined);
    });

    it('should respect configured `path`', async () => {
      const csrfProtect = createCsrfProtect({ cookie: { path: '/sub-directory/' } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const cookie = response.cookies.get('_csrfSecret')!;

      // assertions
      expect(cookie.path).toEqual('/sub-directory/');
    });

    it('should respect configured `sameSite`', async () => {
      const csrfProtect = createCsrfProtect({ cookie: { sameSite: 'lax' } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const cookie = response.cookies.get('_csrfSecret')!;

      // assertions
      expect(cookie.sameSite).toEqual('lax');
    });

    it.each([true, false])('should respect `secure:%s`', async (secure) => {
      const csrfProtect = createCsrfProtect({ cookie: { secure } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);
      const setCookie = response.headers.get('set-cookie')!;

      // assertions
      expect(setCookie.includes('Secure')).toEqual(secure);
    });
  });

  describe('igmoreMethods', () => {
    it('should respect configured ignoreMethods', async () => {
      const csrfProtect = createCsrfProtect({ ignoreMethods: ['POST'] });

      const request = new NextRequest('http://example.com', { method: 'POST' });
      const response = NextResponse.next();
      const csrfError = await csrfProtect(request, response);

      // assertions
      expect(csrfError).toEqual(null);
    });
  });

  describe('excludePathPrefixes', () => {
    it('should respect configured excludePathPrefixes', async () => {
      const csrfProtect = createCsrfProtect({ excludePathPrefixes: ['/ignore-me/sub-path/'] });

      const request = new NextRequest('http://example.com/ignore-me/sub-path/file.jpg');
      const response = NextResponse.next();
      const csrfError = await csrfProtect(request, response);

      // assertions
      expect(response.headers.get('x-csrf-token')).toEqual(null);
      expect(response.headers.get('set-cookie')).toEqual(null);
      expect(csrfError).toEqual(null);
    });
  });

  describe('saltByteLength', () => {
    it('should respect saltByteLength option', async () => {
      for (let byteLength = 10; byteLength < 20; byteLength += 1) {
        const csrfProtect = createCsrfProtect({ saltByteLength: byteLength });

        const request = new NextRequest('http://example.com', { method: 'GET' });
        const response = NextResponse.next();

        await csrfProtect(request, response);
        const token = atou(response.headers.get('x-csrf-token')!);

        // assertions
        expect(token.byteLength).toEqual(22 + byteLength);
      }
    });
  });

  describe('secretByteLength', () => {
    it('should respect secretByteLength option', async () => {
      for (let byteLength = 10; byteLength < 20; byteLength += 1) {
        const csrfProtect = createCsrfProtect({ secretByteLength: byteLength });

        const request = new NextRequest('http://example.com', { method: 'GET' });
        const response = NextResponse.next();

        await csrfProtect(request, response);
        const secret = atou(response.cookies.get('_csrfSecret')!.value);

        // assertions
        expect(secret.byteLength).toEqual(byteLength);
      }
    });
  });

  describe('token', () => {
    it('should respect configured responseHeader', async () => {
      const csrfProtect = createCsrfProtect({ token: { responseHeader: 'my-header' } });

      const request = new NextRequest('http://example.com', { method: 'GET' });
      const response = NextResponse.next();
      await csrfProtect(request, response);

      // assertions
      expect(response.headers.get('my-header')).not.toEqual(null);
    });

    it('should use custom value function', async () => {
      const csrfProtect = createCsrfProtect({
        token: {
          value: async (request: Request) => {
            const formData = await request.formData();
            const formDataVal = formData.get('my_key');
            return (typeof formDataVal === 'string') ? formDataVal : '';
          },
        },
      });

      const secret = createSecret(8);
      const token = await createToken(secret, 8);

      const request = new NextRequest('http://example.com', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `my_key=${encodeURIComponent(utoa(token))}`,
      });
      request.cookies.set('_csrfSecret', utoa(secret));

      const response = NextResponse.next();
      const csrfError = await csrfProtect(request, response);

      // assertions
      expect(csrfError).toEqual(null);
    });
  });
});
