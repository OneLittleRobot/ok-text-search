#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.gutenberg.org/files/67098/67098-0.txt';
const OUTPUT = path.join(__dirname, '../content/winnie-the-pooh.txt');

if (fs.existsSync(OUTPUT)) {
    console.log('Already exists:', OUTPUT);
    process.exit(0);
}

console.log('Downloading Winnie-the-Pooh from Project Gutenberg...');

https.get(URL, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');

        const start = raw.indexOf('CHAPTER I');
        const end = raw.lastIndexOf('*** END');
        if (start === -1 || end === -1) {
            console.error('Could not find expected markers in downloaded text');
            process.exit(1);
        }

        const text = raw.slice(start, end).trim();
        fs.writeFileSync(OUTPUT, text, 'utf8');
        console.log(`Saved ${text.length.toLocaleString()} chars to ${OUTPUT}`);
    });
}).on('error', err => {
    console.error('Download failed:', err.message);
    process.exit(1);
});
