import { NextRequest } from 'next/server';

import * as util from './util';

describe('createSecret', () => {
  it('outputs object of type Uint8Array', () => {
    const secret = util.createSecret(1);
    expect(secret).toBeInstanceOf(Uint8Array);
  });

  it('outputs secrets of configurable length', () => {
    const secret1 = util.createSecret(1);
    const secret2 = util.createSecret(2);
    expect(secret1.byteLength).toEqual(1);
    expect(secret2.byteLength).toEqual(2);
  });

  it('creates unique secrets on each run', () => {
    const secret1 = util.createSecret(8);
    const secret2 = util.createSecret(8);
    expect(secret1).not.toEqual(secret2);
  });
});

describe('utoa', () => {
  it('encodes Uint8Array of length 1 as base64', () => {
    const input = new Uint8Array([0]);
    const output = util.utoa(input);
    expect(output).toEqual('AA==');
  });

  it('encodes Uint8Array of length > 1 as base64', () => {
    const input = new Uint8Array([1, 2, 3]);
    const output = util.utoa(input);
    expect(output).toEqual('AQID');
  });
});

describe('atou', () => {
  it('decodes base64 string of byte length 1 into Uint8Array', () => {
    const input = 'AA==';
    const output = util.atou(input);
    expect(output).toEqual(new Uint8Array([0]));
  });

  it('decodes base64 string of byte length > 1 into Uint8Array', () => {
    const input = 'AQID';
    const output = util.atou(input);
    expect(output).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('handles invalid base-64 strings gracefully', () => {
    const input = 'aü';
    const output = util.atou(input);
    expect(output.byteLength).toEqual(0);
  });
});

describe('getTokenString', () => {
  it('gets token from header', async () => {
    const request = new NextRequest('http://example.com/', {
      headers: {
        'x-csrf-token': 'my-token',
      },
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from form-urlencoded body', async () => {
    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'a=1&csrf_token=my-token',
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from multipart-form-data request', async () => {
    const formData = new FormData();
    formData.set('file', new Blob(['xxx']), 'filename');
    formData.set('csrf_token', 'my-token');

    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      body: formData,
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from json body', async () => {
    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csrf_token: 'my-token' }),
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from json body with content-type ld+json', async () => {
    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify({ csrf_token: 'my-token' }),
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from raw body with other content-type', async () => {
    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      headers: { 'content-type': 'xxx' },
      body: 'my-token',
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from server actions', async () => {
    const formData = new FormData();
    formData.set('2_csrf_token', 'my-token');

    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      body: formData,
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('gets token from raw body with missing content-type', async () => {
    const request = new NextRequest('http://example.com/', {
      method: 'POST',
      body: 'my-token',
    });
    const tokenStr = await util.getTokenString(request);
    expect(tokenStr).toEqual('my-token');
  });

  it('uses token `value` function when defined', async () => {
    const requestOuter = new NextRequest('http://example.com/', {
      method: 'POST',
      body: JSON.stringify({ 'custom-token-name': 'my-token' }),
    });
    const valueFn = async (request: Request) => (await request.json())['custom-token-name'];
    const tokenStr = await util.getTokenString(requestOuter, valueFn);
    expect(tokenStr).toEqual('my-token');
  });
});

describe('createToken', () => {
  it('outputs object of type Uint8Array', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);
    expect(token).toBeInstanceOf(Uint8Array);
  });

  it('outputs tokens of known length', async () => {
    const secret = util.createSecret(8);
    const token1 = await util.createToken(secret, 1);
    const token2 = await util.createToken(secret, 8);
    expect(token1.byteLength).toEqual(23);
    expect(token2.byteLength).toEqual(30);
  });

  it('creates unique tokens on each run', async () => {
    const secret = util.createSecret(8);
    const token1 = await util.createToken(secret, 8);
    const token2 = await util.createToken(secret, 8);
    expect(token1).not.toEqual(token2);
  });
});

describe('verifyToken', () => {
  it('verifies tokens created with createToken()', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);
    const result = await util.verifyToken(token, secret);
    expect(result).toEqual(true);
  });

  it('rejects invalid tokens', async () => {
    const secret = util.createSecret(8);
    const token = new Uint8Array(22);
    const result = await util.verifyToken(token, secret);
    expect(result).toEqual(false);
  });
});

describe('_createSalt', () => {
  it('outputs object of type Uint8Array', () => {
    const salt = util._createSalt(1);
    expect(salt).toBeInstanceOf(Uint8Array);
  });

  it('outputs secrets of configurable length', () => {
    const salt1 = util._createSalt(1);
    const salt2 = util._createSalt(2);
    expect(salt1.byteLength).toEqual(1);
    expect(salt2.byteLength).toEqual(2);
  });

  it('creates unique salts on each run', () => {
    const salt1 = util._createSalt(8);
    const salt2 = util._createSalt(8);
    expect(salt1).not.toEqual(salt2);
  });
});

describe('_hash', () => {
  it('outputs object of type Uint8Array', async () => {
    const secret = util.createSecret(1);
    const salt = util._createSalt(1);
    const hash = await util._hash(secret, salt);
    expect(hash).toBeInstanceOf(Uint8Array);
  });

  it('outputs hash of length 20', async () => {
    const secret = util.createSecret(1);
    const salt = util._createSalt(1);
    const hash = await util._hash(secret, salt);
    expect(hash.byteLength).toEqual(20);
  });

  it('returns known hash for known input', async () => {
    const secret = new Uint8Array(8);
    const salt = new Uint8Array(8);
    const hash = await util._hash(secret, salt);
    expect(hash).toEqual(new Uint8Array([
      225, 41, 242, 124, 81, 3,
      188, 92, 196, 75, 205, 240,
      161, 94, 22, 13, 68, 80,
      102, 255,
    ]));
  });

  it('creates same hashes for same salts', async () => {
    const secret = util.createSecret(8);
    const salt1 = util._createSalt(8);
    const salt2 = new Uint8Array(salt1);
    const hash1 = await util._hash(secret, salt1);
    const hash2 = await util._hash(secret, salt2);
    expect(hash1).toEqual(hash2);
  });

  it('creates different hashes for different salts', async () => {
    const secret = util.createSecret(8);
    const salt1 = util._createSalt(8);
    const salt2 = util._createSalt(8);
    const hash1 = await util._hash(secret, salt1);
    const hash2 = await util._hash(secret, salt2);
    expect(hash1).not.toEqual(hash2);
  });
});
