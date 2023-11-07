import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

const suite = new Benchmark.Suite;
const obj = {key: 1000};

suite
  .add('with lookup', function() {
    let x;
    for (let i = 0; i < obj.key; i++) x = i;
  })
  .add('without lookup', function() {
    let x;
    let m = obj.key;
    for (let i = 0; i < m; i++) x = i;
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
