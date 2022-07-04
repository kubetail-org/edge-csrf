import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

const suite = new Benchmark.Suite;
const numChars = 1000;

suite
  .add('join with literal array', function() {
    let output = [];
    output.length = numChars;
    for (let i=0; i<numChars; i++) output[i] = 'x';
    output.join('');
  })
  .add('join with Array object', function() {
    let output = new Array(numChars);
    for (let i=0; i<numChars; i++) output[i] = 'x';
    output.join('');
  })
  .add('append', function() {
    let output = ''
    for (let i=0; i<numChars; i++) output += 'x';
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
