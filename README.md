# OK Text Search [![NPM version][npm-image]][npm-url] [![CI][ci-image]][ci-url]

Multi-phrase text search using the Aho-Corasick algorithm. Useful when you need to find many strings in a piece of text simultaneously, especially when those phrases are long. No runtime dependencies; works in the browser.

> **When to use this**: Aho-Corasick processes each character of the text once regardless of how many phrases you're searching for. The longer your phrases, the larger the advantage over repeated `indexOf` calls. See the [benchmarks](#benchmarks) below.

## Installation

```sh
npm install ok-text-search
```

## Usage

```ts
import Search from 'ok-text-search';

const search = new Search(['something', 'another thing']);
search.add('yet another thing');
search.build();

const results = search.exec('Lorem ipsum dolor something amet');
// [{ index: 18, text: 'something' }]
```

Call order matters: add all phrases, then `build()` once, then call `exec()` as many times as needed. Adding phrases after `build()` throws.

### Case-insensitive matching

```ts
const search = new Search(['Hello World'], { caseInsensitive: true });
search.build();

search.exec('say hello world today');
// [{ index: 4, text: 'Hello World' }]
```

The original phrase casing is preserved in results. Indices are in Unicode code points, so emoji and non-BMP characters count as one position each.

## Benchmarks

Three approaches are compared:

- **simple** — naive loop calling `String.indexOf` for each phrase; no setup cost
- **custom (exec only)** — this library, `build()` called once upfront, only `exec()` measured
- **custom (build + exec)** — this library, `build()` + `exec()` measured together; what you pay if you rebuild on every search

Run them yourself:

```sh
npm run benchmark
```

---

### Foods — short phrase list (~200 food names, 4–14 chars each)

| Test | Text | Matches | simple | custom (exec only) | custom (build + exec) |
|------|------|---------|--------|--------------------|-----------------------|
| short foods 1 | 48-char sentence, 1 food name | 1 | 917K ops/s | 4,340K ops/s | 32.3K ops/s |
| short foods 2 | 490-char paragraph, 4 food names | 4 | 362K ops/s | 394K ops/s | 29.4K ops/s |
| medium foods 1 | 1,000-char text, 5 matches (incl. "Grape"/"Grapefruit" overlap) | 5 | 192K ops/s | 136K ops/s | 25.9K ops/s |

---

### Movies — multi-word titles (5–37 chars, spaces and punctuation)

| Test | Text | Matches | simple | custom (exec only) | custom (build + exec) |
|------|------|---------|--------|--------------------|-----------------------|
| medium movies 1 | 3,800-char text, 8 title occurrences | 8 | 39.0K ops/s | 43.4K ops/s | 6.6K ops/s |

---

### Quotes — full sentences (40–85 chars each)

Phrases are complete quotations, e.g. `Strive not to be a success, but rather to be of value. –Albert Einstein`.

| Test | Text | Matches | simple | custom (exec only) | custom (build + exec) |
|------|------|---------|--------|--------------------|-----------------------|
| short quotes 1 | 200-char text, 1 match | 1 | 12.3K ops/s | 839K ops/s | 15.4 ops/s |
| medium quotes 1 | 1,800-char text, 4 matches | 4 | 2.2K ops/s | 94.7K ops/s | 15.2 ops/s |
| long quotes 1 | 12,000-char text, 3 matches | 3 | 336 ops/s | 10,692 ops/s | 13.7 ops/s |

---

### Reading the results

**`custom (build + exec)` loses to `simple` in every case.** Build cost is not free, and if you reconstruct the automaton on each search you'd have been better off with `indexOf`. For the quotes phrase set (long patterns → deep trie), `build()` runs at ~15 ops/sec while naive `indexOf` manages 336 ops/sec — simple wins by 24×.

`build()` must be paid once and amortised over many `exec()` calls. Once it is:

- **Short phrases (< ~15 chars)**: `indexOf` can still edge ahead when the phrase count is large and matches are dense (`medium foods 1`, where ~200 names averaging ~8 chars are searched through 1,000 chars of text).
- **Medium phrases (15–40 chars)**: break-even. Movie titles already favour Aho-Corasick.
- **Long phrases (40+ chars)**: Aho-Corasick wins decisively — 31–67× faster in the quotes tests. `indexOf` must re-scan the text from every position for every phrase; Aho-Corasick touches each character exactly once regardless of phrase count.

[ci-url]: https://github.com/OneLittleRobot/ok-text-search/actions/workflows/ci.yml
[ci-image]: https://github.com/OneLittleRobot/ok-text-search/actions/workflows/ci.yml/badge.svg
[npm-url]: https://npmjs.org/package/ok-text-search
[npm-image]: https://badge.fury.io/js/ok-text-search.svg
