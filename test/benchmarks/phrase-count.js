'use strict';

// Scales from 1 to 20 phrases against the full Winnie-the-Pooh text (~123K chars).
// Shows the crossover point where Aho-Corasick starts to beat repeated indexOf.
//
// Run: node ./test/benchmarks/phrase-count.js

var Search = require('../../lib/search').default;
var Benchmark = require('benchmark');
var async = require('async');
var fs = require('fs');
var path = require('path');

var initSimple = require('./alternatives/simple');

const winniePath = path.join(__dirname, '../content/winnie-the-pooh.txt');

if (!fs.existsSync(winniePath)) {
    console.error('Winnie-the-Pooh text not found. Run: npm run fetch-texts');
    process.exit(1);
}

const text = fs.readFileSync(winniePath, 'utf8');

// 100 phrases that all appear in the text, ordered from specific to common.
// Each run adds the next phrase to the set so phrase count grows from 1 to 100.
const phrases = [
    'Pooh',
    'Piglet',
    'Christopher Robin',
    'Eeyore',
    'Rabbit',
    'Kanga',
    'Owl',
    'Roo',
    'Winnie-the-Pooh',
    'Heffalump',
    'honey',
    'forest',
    'balloon',
    'thought',
    'little',
    'very',
    'time',
    'said',
    'went',
    'know',
    'something',
    'himself',
    'morning',
    'because',
    'could',
    'would',
    'about',
    'there',
    'which',
    'think',
    'again',
    'round',
    'right',
    'began',
    'house',
    'after',
    'first',
    'head',
    'dear',
    'good',
    'home',
    'long',
    'more',
    'over',
    'just',
    'when',
    'down',
    'that',
    'with',
    'them',
    'from',
    'have',
    'like',
    'only',
    'into',
    'were',
    'back',
    'then',
    'they',
    'this',
    'what',
    'Bear',
    'sort',
    'well',
    'who',
    'out',
    'see',
    'him',
    'got',
    'can',
    'say',
    'one',
    'did',
    'way',
    'off',
    'not',
    'put',
    'day',
    'all',
    'his',
    'had',
    'for',
    'but',
    'are',
    'now',
    'you',
    'was',
    'and',
    'the',
    'yes',
    'yes',
    'look',
    'tree',
    'door',
    'came',
    'went',
    'find',
    'help',
    'call',
];

const results = [];

const runN = (n, callback) => {
    const phraseSet = phrases.slice(0, n);
    const simpleSearch = initSimple(phraseSet);
    const customSearch = new Search(phraseSet);
    customSearch.build();

    new Benchmark.Suite()
        .add('simple', function () { simpleSearch(text); })
        .add('custom', function () { customSearch.exec(text); })
        .on('complete', function () {
            const getHz = b => 1 / (b.stats.mean + b.stats.moe);
            const simpleHz = getHz(this[0]);
            const customHz = getHz(this[1]);
            const winner = customHz > simpleHz ? 'custom' : 'simple';
            const ratio = customHz > simpleHz
                ? (customHz / simpleHz).toFixed(2) + '× custom'
                : (simpleHz / customHz).toFixed(2) + '× simple';
            results.push({ n, simpleHz, customHz, winner, ratio });
            process.stdout.write('.');
            callback();
        })
        .run({ async: true, maxTime: 5 });
};

const counts = Array.from({ length: 100 }, (_, i) => i + 1);

console.log('Scaling 1→100 phrases against Winnie-the-Pooh (~123K chars)');
console.log('Each dot = one phrase count completed\n');

async.eachSeries(counts, runN, function () {
    console.log('\n');
    console.log('phrases | simple (ops/s) | custom (ops/s) | winner');
    console.log('--------|----------------|----------------|-------');
    results.forEach(({ n, simpleHz, customHz, ratio }) => {
        const s = Math.round(simpleHz).toLocaleString().padStart(14);
        const c = Math.round(customHz).toLocaleString().padStart(14);
        const nStr = String(n).padStart(7);
        console.log(`${nStr} | ${s} | ${c} | ${ratio}`);
    });
    console.log('\nCSV:');
    console.log('phrases,simple,custom');
    results.forEach(({ n, simpleHz, customHz }) => {
        console.log(`${n},${Math.round(simpleHz)},${Math.round(customHz)}`);
    });
});
