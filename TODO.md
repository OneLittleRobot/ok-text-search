# TODO

## Infrastructure

- [x] Replace Travis CI with GitHub Actions — mirror the workflow from [resistor-data](https://github.com/OneLittleRobot/resistor-data): push/PR on `master`, Node matrix 18.x / 20.x / 22.x, `npm ci` + `npm test`
- [x] Upgrade to TypeScript — follow resistor-data conventions: `typescript ^5`, `ts-node ^10`, `@types/mocha`, `@types/chai`; `tsconfig.json` targeting ES2020/commonjs; `.mocharc.json` using `ts-node/register`; source in `src/`, output in `lib/`
- [x] Move source from `source/search.js` → `src/search.ts` and rewrite tests in TypeScript (`test/**/*.ts`)
- [x] Replace Babel build pipeline (`babel-cli`, `babel-preset-es2015`, `.babelrc`) with `tsc`
- [x] Update `package.json`: `build` → `tsc`, `test` → `mocha`, add `prepublishOnly: npm run build`, add `types` field pointing to `lib/index.d.ts`

## Bugs / Correctness

- [x] Fix `index.js` — export name is `bandsToNotation` (copy-paste artifact); rename to something meaningful and ensure it points to the correct built output
- [x] Guard against `add()` after `build()` — calling `add()` after failure links are built silently produces wrong results; throw or rebuild on next `exec()` call
- [x] Fix Unicode surrogate pair handling — replace `text.split('')` with `[...text]` so characters outside the BMP (emoji, etc.) are treated as single code points and index arithmetic stays correct
- [x] Fix `this.parent;` / `this.fall;` no-ops in `TrieNode` constructor — these expression statements do nothing; replace with `this.parent = null` and `this.fall = null`
- [x] Remove dead `phrase` parameter from `Search.prototype.build(phrase)` — it is never used

## Design

- [x] Throw instead of `console.log` in the default `exec()` — silent failure when `build()` has not been called is hard to debug; throw `new Error('call build() before exec()')`
- [x] Replace sparse `childNodes` array with `Map<string, TrieNode>` — indexing by `charCodeAt(0)` creates arrays with thousands of empty slots for Unicode content and makes the BFS loop iterate over all of them
- [x] Pass `char` directly to `TrieNode` constructor in `createTrie` — `createTrie` currently passes no argument then sets `node.char` manually; should just be `new TrieNode(char)`
- [x] Store matched phrase on terminal node at insert time — `findPhrase()` walks the parent chain on every match (O(k) per match); storing the phrase string during `add()` makes lookups O(1)
- [x] Use strict equality (`===`) in `TrieNode.prototype.getChild` — `currentNode.char == str` uses loose equality

## Performance

- [x] Fix O(n²) BFS in `buildFailureLinks` — `Array.shift()` re-indexes the whole array on every pop; replaced with an index counter so the queue is append-only and the BFS is O(n)
- [x] Remove dead `TrieNode.char` and `TrieNode.parent` fields — only needed by the old `findPhrase()` parent-chain walk; removing them shrinks every node's memory footprint
- [ ] Add output links (dict suffix links) — precompute a `dict` pointer on each node during `build()` pointing to the nearest end-node ancestor in the failure chain; eliminates the inner `while (node !== trie)` loop for non-matching nodes, making search formally O(n + m + z). Affects `exec()` speed, measurable in benchmarks
- [ ] Avoid materialising `[...text]` on every `exec()` call — allocates an array the length of the text on each search; for ASCII content, replace with `text.charCodeAt(i)` in the hot loop and store char codes in the trie instead of strings, skipping both the allocation and Map string-key hashing
- [ ] Benchmark `build()` time separately — current benchmarks only cover `exec()`; the BFS and dead-field fixes only benefit `build()` and have no visible effect on the existing suite

## Minor

- [x] Remove double semicolon in `index.js`
- [x] Add case-insensitive search option
- [ ] Deduplicate phrases on insert — adding the same phrase twice silently wastes trie nodes
