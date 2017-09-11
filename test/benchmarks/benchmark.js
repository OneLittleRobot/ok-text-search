var Search = require('../../lib/search').default;
var searches = require('../content/searches.json');
var testData = require('../content/test-data.json');
var Benchmark = require('benchmark');
var async = require('async');


var initSimpleSearch = require('./alternatives/simple');
var initNodeAhoCorasick = require('./alternatives/node-aho-corasick');


const breaker = '\n - - - - - - - - - - - - - - - - - - - - - - - - \n';


const {formatNumber} = Benchmark

const run = (data, callback) => {



    const nodeAhoCorasick = initNodeAhoCorasick(searches[data.type]);
    const simpleSearch = initSimpleSearch(searches[data.type]);

    const customSearch = new Search(searches[data.type]);
    customSearch.build();

    var suite = new Benchmark.Suite;

    /**
     * Gets the Hz, i.e. operations per second, of `bench` adjusted for the
     * margin of error.
     *
     **/
    const getHz = function (bench) {
        return 1 / (bench.stats.mean + bench.stats.moe);
    };
    console.log(breaker);
    console.log(data.title)
    console.log('\n');

    suite
     .add('nodeAhoCorasick', function () {
         nodeAhoCorasick(data.text);
     })
        .add('simple', function () {
            simpleSearch(data.text);
        })
        .add('custom', function () {
            customSearch.search(data.text);
        })
        .on('cycle', function (event) {
            console.log(String(event.target));
        })
        .on('onAbort',function(event){
            console.log('abort')
        })
        .on('complete', function () {
            const benches = this.filter('successful'),
                fastest = this.filter('fastest'),
                slowest = this.filter('slowest');

            const fastestHz = getHz(fastest[0])

            console.log('\n');
            console.log(fastest[0].name + ' is the fastest');
            console.log(slowest[0].name + ' is the slowest');

            console.log('\n');
            benches
                .filter(item => {
                    return item.name !== fastest[0].name;
                })
                .each(function (bench) {
                    const hz = getHz(bench);
                    const percent = (1 - (hz / fastestHz)) * 100;
                    const text = bench.name + ' is ' + (isFinite(hz) ? formatNumber(percent < 1 ? percent.toFixed(2) : Math.round(percent)) + '% slower' : '');
                    console.log(text)
                });
            console.log('\n');
            console.log('\n');
            callback()
        }).run({'async': true, maxTime: 20});
}

async.eachSeries(testData, run, function () {
    //console.log('done');
})
