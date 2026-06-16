# OK Text Search [![NPM version][npm-image]][npm-url] [![CI][ci-image]][ci-url]

Multi-phrase text search using the Aho-Corasick algorithm. Useful when you need to find many strings in a piece of text simultaneously, especially when those phrases are long. No runtime dependencies; works in the browser.

> **When to use this**: Aho-Corasick processes each character of the text once regardless of how many phrases you're searching for. The longer your phrases, the larger the advantage over repeated `indexOf` calls. See the [benchmarks](#benchmarks) below or the [full benchmark analysis](benchmarks.md).

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

Four approaches are compared:

| Approach | What it does |
|----------|-------------|
| **simple (find all)** | `indexOf` loop per phrase; returns every occurrence |
| **simple (find first)** | `indexOf` loop per phrase; returns on the first hit |
| **custom `exec()`** | Aho-Corasick single pass; returns every occurrence |
| **custom `execFirst()`** | Aho-Corasick single pass; returns first match by text position |

Run the benchmarks:

```sh
npm run benchmark
```

---

The three variables that determine the winner are **phrase count**, **phrase length**, and **text length**.

### Long phrases - custom wins decisively

5,523 phrases, 40–85 chars each, 12,000-char text:

| | simple (find all) | custom exec() |
|-|-:|-:|
| ops/sec | 335 | 10,550 |
| relative | - | **31× faster** |

Long phrases are where Aho-Corasick wins most clearly: each `indexOf` call must compare up to 85 characters at every position in the text. The advantage scales with phrase length and text length.

### Few phrases - simple wins

12 character names, 123,000-char text:

| | simple (find all) | custom exec() |
|-|-:|-:|
| ops/sec | 5,096 | 1,155 |
| relative | - | 4.4× slower |

With fewer than ~20 phrases, native `indexOf` calls are cheaper than walking a trie through 123K characters.

### The crossover - 123K-char text, phrases 1 → 100

On a 123K-char text, adding one phrase at a time:

| phrases | simple (ops/s) | custom (ops/s) | winner |
|--------:|---------------:|---------------:|--------|
| 1 | 124,863 | 1,163 | simple 107× |
| 10 | 10,669 | 814 | simple 13× |
| 20 | 1,774 | 813 | simple 2.2× |
| **33** | **713** | **741** | **custom (crossover)** |
| 60 | 353 | 715 | custom 2× |
| 100 | 198 | 650 | custom 3.3× |

Custom first edges ahead at phrase 33 and leads by 3.3× at 100 phrases. Run `npm run benchmark:phrase-count` to reproduce.

### find-first: execFirst() is order-independent

`simple (find first)` exits after the first phrase in the list that matches - a huge speedup when the matching phrase happens to be near the front of the list, but fragile in production where list order isn't controlled. `custom execFirst()` always finds the earliest match **by text position**, so it is unaffected by list order.

| Scenario | simple (find first) | custom execFirst() |
|----------|--------------------:|-------------------:|
| 130 phrases, 1K text | 1,409K ops/s | **8,662K** ops/s |
| 249 phrases, 3.8K text | 566K ops/s | **6,375K** ops/s |
| 5,523 phrases, 12K text | 1,062K ops/s* | 205K ops/s |

_* matching phrase sits near the front of the 5,523-phrase list - shuffle it to position 5,000 and simple's figure collapses to ~335 ops/s._

### Build amortisation

`build()` is a one-time cost. For the quotes phrase set (5,523 phrases, 64ms to build), the savings per `exec()` call are ~2.9ms - so the build cost is recovered in **23 calls**. After that, every check is 31× faster than simple.

At 10,000 checks: **1 second** (custom) vs **30 seconds** (simple).

If you add `{ caseInsensitive: true }`, exec overhead increases by ~21% on long texts and ~62% on short texts - the break-even stays under 30 calls.

See [benchmarks.md](benchmarks.md) for the full analysis including find-first comparisons, position tests, density tests, and case-insensitive overhead.

[ci-url]: https://github.com/OneLittleRobot/ok-text-search/actions/workflows/ci.yml
[ci-image]: https://github.com/OneLittleRobot/ok-text-search/actions/workflows/ci.yml/badge.svg
[npm-url]: https://npmjs.org/package/ok-text-search
[npm-image]: https://badge.fury.io/js/ok-text-search.svg
