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

Two approaches are compared:

- **simple** — a naive loop calling `String.indexOf` for each phrase separately
- **custom** — this library (Aho-Corasick)

The benchmark does not include setup time (`build()`), only the per-search cost.

Run them yourself:

```sh
npm run benchmark
```

---

### Foods — short phrase list (~200 food names, 4–14 chars each)

The phrase list is a large dictionary of food names. Short phrases are where V8's native `indexOf` is hardest to beat.

| Test | Text | Matches | simple | custom | Result |
|------|------|---------|--------|--------|--------|
| short foods 1 | 48-char sentence containing one food name | 1 | 959K ops/s | 2,480K ops/s | **custom 61% faster** |
| short foods 2 | 490-char paragraph with four food names | 4 | 382K ops/s | 203K ops/s | simple 47% faster |
| medium foods 1 | 1,000-char text; includes "Grape" and "Grapefruit" at the same position (overlapping prefix match) | 5 | 197K ops/s | 68K ops/s | simple 65% faster |

---

### Movies — multi-word titles (5–37 chars, spaces and punctuation)

Phrases are movie titles like `One Flew Over the Cuckoo's Nest` and `The Lord of the Rings: The Two Towers`. Longer than food names but still under 40 chars.

| Test | Text | Matches | simple | custom | Result |
|------|------|---------|--------|--------|--------|
| medium movies 1 | 3,800-char text with 8 title occurrences | 8 | 40K ops/s | 24K ops/s | simple 40% faster |

---

### Quotes — full sentences (40–85 chars each)

Phrases are complete quotations, e.g. `Strive not to be a success, but rather to be of value. –Albert Einstein`. This is where Aho-Corasick's advantage becomes decisive: `indexOf` must compare up to 85 characters per candidate position in the text, while Aho-Corasick touches each character of the text exactly once.

| Test | Text | Matches | simple | custom | Result |
|------|------|---------|--------|--------|--------|
| short quotes 1 | 200-char text containing one quote | 1 | 12.9K ops/s | 486K ops/s | **custom 37× faster** |
| medium quotes 1 | 1,800-char text containing four quotes | 4 | 2.4K ops/s | 53.7K ops/s | **custom 22× faster** |
| long quotes 1 | 12,000-char text containing three quotes | 3 | 348 ops/s | 6,717 ops/s | **custom 19× faster** |

---

### Reading the results

The crossover is **phrase length**, not text length or phrase count:

- **Short phrases (< ~20 chars)**: `indexOf` wins in most cases. V8's implementation is highly tuned for short patterns and the trie traversal overhead outweighs the algorithmic benefit.
- **Long phrases (40+ chars)**: Aho-Corasick wins decisively, with 19–37× speedups observed. The gain grows with text length because the O(n) guarantee compounds over a longer scan.

The one exception in the food tests (`short foods 1`) is because only a single phrase was present in the result set — the trie lookup for a single pattern is essentially free compared to the cost of scanning even a short string.

[ci-url]: https://github.com/OneLittleRobot/ok-text-search/actions/workflows/ci.yml
[ci-image]: https://github.com/OneLittleRobot/ok-text-search/actions/workflows/ci.yml/badge.svg
[npm-url]: https://npmjs.org/package/ok-text-search
[npm-image]: https://badge.fury.io/js/ok-text-search.svg
