var Search = require('../../lib/search').default;
var searches = require('../content/searches.json');
var testData = require('../content/test-data.json');
var Benchmark = require('benchmark');
var async = require('async');
var fs = require('fs');
var path = require('path');

var initSimple = require('./alternatives/simple');
var initSimpleFirst = require('./alternatives/simpleFirst');

const breaker = '\n - - - - - - - - - - - - - - - - - - - - - - - - \n';

const { formatNumber } = Benchmark;

const report = function (suite) {
    const getHz = bench => 1 / (bench.stats.mean + bench.stats.moe);
    const benches = suite.filter('successful');
    const fastest = suite.filter('fastest');
    const slowest = suite.filter('slowest');
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
            console.log(bench.name + ' is ' + (isFinite(hz) ? formatNumber(percent < 1 ? percent.toFixed(2) : Math.round(percent)) + '% slower' : ''));
        });

    console.log('\n');
};

const run = (data, callback) => {
    const simpleAll = initSimple(searches[data.type]);
    const simpleFirst = initSimpleFirst(searches[data.type]);

    const customSearch = new Search(searches[data.type]);
    customSearch.build();

    console.log(breaker);
    console.log(data.title);
    console.log('\n');

    new Benchmark.Suite()
        .add('simple (find all)', function () { simpleAll(data.text); })
        .add('simple (find first)', function () { simpleFirst(data.text); })
        .add('custom exec()', function () { customSearch.exec(data.text); })
        .add('custom execFirst()', function () { customSearch.execFirst(data.text); })
        .add('custom (build + exec)', function () {
            const s = new Search(searches[data.type]);
            s.build();
            s.exec(data.text);
        })
        .on('cycle', function (event) { console.log(String(event.target)); })
        .on('complete', function () { report(this); callback(); })
        .run({ 'async': true, maxTime: 20 });
};

const winniePath = path.join(__dirname, '../content/winnie-the-pooh.txt');
const winnieText = fs.existsSync(winniePath) ? fs.readFileSync(winniePath, 'utf8') : null;

const runWinnie = (phraseType, callback) => {
    if (!winnieText) return callback();

    const simpleAll = initSimple(searches[phraseType]);
    const simpleFirst = initSimpleFirst(searches[phraseType]);
    const customSearch = new Search(searches[phraseType]);
    customSearch.build();

    const charCount = winnieText.length.toLocaleString();
    console.log(breaker);
    console.log(`winnie-the-pooh [${phraseType}] — ${charCount} chars`);
    console.log('\n');

    new Benchmark.Suite()
        .add('simple (find all)', function () { simpleAll(winnieText); })
        .add('simple (find first)', function () { simpleFirst(winnieText); })
        .add('custom exec()', function () { customSearch.exec(winnieText); })
        .add('custom execFirst()', function () { customSearch.execFirst(winnieText); })
        .add('custom (build + exec)', function () {
            const s = new Search(searches[phraseType]);
            s.build();
            s.exec(winnieText);
        })
        .on('cycle', function (event) { console.log(String(event.target)); })
        .on('complete', function () { report(this); callback(); })
        .run({ 'async': true, maxTime: 20 });
};

async.eachSeries(testData, run, function () {
    if (!winnieText) {
        console.log('\nTip: run "npm run fetch-texts" to download long-text benchmarks (Winnie-the-Pooh, ~123K chars)\n');
        return;
    }
    async.eachSeries(
        ['winnie-names', 'winnie-quotes', 'winnie-start', 'winnie-middle', 'winnie-end', 'winnie-the'],
        runWinnie,
        function () {}
    );
});
