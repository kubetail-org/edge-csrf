import './setupGlobals';

import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

import { createSecret, createToken, verifyToken } from '../util.js';

const suite = new Benchmark.Suite;
const secret = createSecret(18);
const token = await createToken(secret, 8);

suite
  .add('verifyToken', async function() {
    await verifyToken(token, secret);
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
