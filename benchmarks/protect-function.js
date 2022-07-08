import './setupGlobals';

import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

import nextserver from 'next/server';
const { NextRequest, NextResponse } = nextserver;

import csrf from '../index';
import { createSecret, createToken, utoa } from '../util';

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
