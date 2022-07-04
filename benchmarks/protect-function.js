import primitives from '@edge-runtime/primitives';

// polyfill
global.crypto = primitives.default.crypto;
global.Request = primitives.default.Request;
global.Response = primitives.default.Response;

import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

const { NextRequest, NextResponse } = await import('next/server.js');

import csrf from '../index.js';
import { createSecret, createToken, utoa } from '../util.js';

const suite = new Benchmark.Suite;

const secret = createSecret(8);
const token = await createToken(secret, 8);
const request = new Request('http://example.com', {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
  },
  body: 'csrf_token=' + encodeURIComponent(utoa(token), 8)
})
const response = NextResponse.next();
const csrfProtect = csrf();

suite
  .add('secretByteLength:8, saltByteLength:8', async function() {
    await csrfProtect(request, response);
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
