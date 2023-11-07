import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';
import { NextResponse } from 'next/server';
import { Request } from '@edge-runtime/ponyfill';

import csrf from '../dist/cjs/index.js';
import { createSecret, createToken, utoa } from '../dist/cjs/util.js';

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
