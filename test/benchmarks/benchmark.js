var Search = require('../../lib/search').default;
var searches = require('../content/searches.json');
var testData = require('../content/test-data.json');
var Benchmark = require('benchmark');
var async = require('async');

var initSimpleSearch = require('./alternatives/simple');

const breaker = '\n - - - - - - - - - - - - - - - - - - - - - - - - \n';

const { formatNumber } = Benchmark;

const run = (data, callback) => {
    const simpleSearch = initSimpleSearch(searches[data.type]);

    const customSearch = new Search(searches[data.type]);
    customSearch.build();

    var suite = new Benchmark.Suite;

    const getHz = function (bench) {
        return 1 / (bench.stats.mean + bench.stats.moe);
    };

    console.log(breaker);
    console.log(data.title);
    console.log('\n');

    suite
        .add('simple', function () {
            simpleSearch(data.text);
        })
        .add('custom', function () {
            customSearch.exec(data.text);
        })
        .on('cycle', function (event) {
            console.log(String(event.target));
        })
        .on('complete', function () {
            const benches = this.filter('successful'),
                fastest = this.filter('fastest'),
                slowest = this.filter('slowest');

            const fastestHz = getHz(fastest[0]);

            console.log('\n');
            console.log(fastest[0].name + ' is the fastest');
            console.log(slowest[0].name + ' is the slowest');

            console.log('\n');
            benches
                .filter(item => item.name !== fastest[0].name)
                .each(function (bench) {
                    const hz = getHz(bench);
                    const percent = (1 - (hz / fastestHz)) * 100;
                    const text = bench.name + ' is ' + (isFinite(hz) ? formatNumber(percent < 1 ? percent.toFixed(2) : Math.round(percent)) + '% slower' : '');
                    console.log(text);
                });

            console.log('\n');
            callback();
        }).run({ 'async': true, maxTime: 20 });
};

async.eachSeries(testData, run, function () {});
