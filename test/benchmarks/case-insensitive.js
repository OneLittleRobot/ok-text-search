'use strict';

// Measures the overhead of caseInsensitive: true vs case-sensitive exec().
// The cost comes from toLowerCase() applied to the full text on every exec() call.
//
// Run: node ./test/benchmarks/case-insensitive.js

var Search = require('../../lib/search').default;
var Benchmark = require('benchmark');
var async = require('async');
var fs = require('fs');
var path = require('path');

const winniePath = path.join(__dirname, '../content/winnie-the-pooh.txt');
if (!fs.existsSync(winniePath)) {
    console.error('Winnie-the-Pooh text not found. Run: npm run fetch-texts');
    process.exit(1);
}

const winnieText = fs.readFileSync(winniePath, 'utf8');
const searches = require('../content/searches.json');

const breaker = '\n - - - - - - - - - - - - - - - - - - - - - - - - \n';

// Banned-phrase-style list: use winnie-quotes phrases but uppercased to simulate
// a real scenario where the incoming text may be any case
const bannedPhrases = searches['winnie-quotes'].map(p => p.toUpperCase());

const suites = [
    {
        title: 'build() overhead — winnie-quotes (13 phrases)',
        fn: (callback) => {
            const phrases = searches['winnie-quotes'];
            new Benchmark.Suite()
                .add('build (case-sensitive)', function () {
                    const s = new Search(phrases);
                    s.build();
                })
                .add('build (case-insensitive)', function () {
                    const s = new Search(phrases, { caseInsensitive: true });
                    s.build();
                })
                .on('cycle', e => console.log(String(e.target)))
                .on('complete', function () {
                    console.log('\n');
                    callback();
                })
                .run({ async: true, maxTime: 10 });
        },
    },
    {
        title: 'exec() overhead — winnie-quotes phrases, 123K text',
        fn: (callback) => {
            const phrases = searches['winnie-quotes'];
            const cs = new Search(phrases);
            cs.build();
            const ci = new Search(phrases, { caseInsensitive: true });
            ci.build();
            new Benchmark.Suite()
                .add('exec() case-sensitive', function () { cs.exec(winnieText); })
                .add('exec() case-insensitive', function () { ci.exec(winnieText); })
                .on('cycle', e => console.log(String(e.target)))
                .on('complete', function () {
                    console.log('\n');
                    callback();
                })
                .run({ async: true, maxTime: 20 });
        },
    },
    {
        title: 'exec() overhead — quotes phrases (5,523), 12K text',
        fn: (callback) => {
            const phrases = searches['quotes'];
            const texts = require('../content/test-data.json');
            const text = texts.find(t => t.title === 'long quotes 1').text;
            const cs = new Search(phrases);
            cs.build();
            const ci = new Search(phrases, { caseInsensitive: true });
            ci.build();
            new Benchmark.Suite()
                .add('exec() case-sensitive', function () { cs.exec(text); })
                .add('exec() case-insensitive', function () { ci.exec(text); })
                .on('cycle', e => console.log(String(e.target)))
                .on('complete', function () {
                    console.log('\n');
                    callback();
                })
                .run({ async: true, maxTime: 20 });
        },
    },
    {
        title: 'banned phrase list — incoming text may be any case (123K text)',
        fn: (callback) => {
            // Simulate: banned phrases stored in UPPER CASE, incoming text is mixed case.
            // Case-sensitive would miss "tut-tut, it looks like rain" if phrase is "TUT-TUT...".
            // Case-insensitive catches it regardless.
            const ci = new Search(bannedPhrases, { caseInsensitive: true });
            ci.build();
            const cs = new Search(bannedPhrases);
            cs.build();
            new Benchmark.Suite()
                .add('exec() case-sensitive  (misses mixed-case content)', function () { cs.exec(winnieText); })
                .add('exec() case-insensitive (catches mixed-case content)', function () { ci.exec(winnieText); })
                .on('cycle', e => console.log(String(e.target)))
                .on('complete', function () {
                    console.log('\n');
                    callback();
                })
                .run({ async: true, maxTime: 20 });
        },
    },
];

async.eachSeries(suites, ({ title, fn }, cb) => {
    console.log(breaker);
    console.log(title);
    console.log('\n');
    fn(cb);
}, () => {});
