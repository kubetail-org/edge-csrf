import Benchmark from 'benchmark';
import beautify from 'beautify-benchmark';

const suite = new Benchmark.Suite;

suite
  .add('for loop', function() {
    let x;
    for (let i=0; i<1000; i++) x = i;
  })
  .add('while loop', function() {
    let x;
    let i = 1000;
    while (i--) x = i;
  })
  .on('cycle', function(event) {
    beautify.add(event.target);
  })
  .on('complete', function() {
    beautify.log();
  })
  .run({ 'async': true });
