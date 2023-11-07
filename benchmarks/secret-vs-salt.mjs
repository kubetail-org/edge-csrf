import primitives from '@edge-runtime/primitives';

// polyfill
global.crypto = primitives.default.crypto;

import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

import { createSecret, _createSalt } from '../util.js';

const suite = new Benchmark.Suite;

suite
  .add('secretByteLength:8', async function() {
    createSecret(8);
  })
  .add('saltByteLength:8', async function() {
    _createSalt(8);
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
