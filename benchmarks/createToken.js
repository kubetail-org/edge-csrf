import primitives from '@edge-runtime/primitives';

// polyfill
global.crypto = primitives.default.crypto;

import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

import { createSecret, createToken } from '../util.js';

const suite = new Benchmark.Suite;
const secret = createSecret(8);

suite
  .add('secretByteLength:8, saltByteLength:8', async function() {
    await createToken(secret, 8);
  })
  .add('secretByteLength:8, saltByteLength:4', async function() {
    await createToken(secret, 4);
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
