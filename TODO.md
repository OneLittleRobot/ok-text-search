# TODO

## Infrastructure

- [ ] Replace Travis CI with GitHub Actions — mirror the workflow from [resistor-data](https://github.com/OneLittleRobot/resistor-data): push/PR on `master`, Node matrix 18.x / 20.x / 22.x, `npm ci` + `npm test`
- [ ] Upgrade to TypeScript — follow resistor-data conventions: `typescript ^5`, `ts-node ^10`, `@types/mocha`, `@types/chai`; `tsconfig.json` targeting ES2020/commonjs; `.mocharc.json` using `ts-node/register`; source in `src/`, output in `lib/`
- [ ] Move source from `source/search.js` → `src/search.ts` and rewrite tests in TypeScript (`test/**/*.ts`)
- [ ] Replace Babel build pipeline (`babel-cli`, `babel-preset-es2015`, `.babelrc`) with `tsc`
- [ ] Update `package.json`: `build` → `tsc`, `test` → `mocha`, add `prepublishOnly: npm run build`, add `types` field pointing to `lib/index.d.ts`

## Bugs / Correctness

- [ ] Fix `index.js` — export name is `bandsToNotation` (copy-paste artifact); rename to something meaningful and ensure it points to the correct built output
- [ ] Guard against `add()` after `build()` — calling `add()` after failure links are built silently produces wrong results; throw or rebuild on next `exec()` call
- [ ] Fix Unicode surrogate pair handling — replace `text.split('')` with `[...text]` so characters outside the BMP (emoji, etc.) are treated as single code points and index arithmetic stays correct
- [ ] Fix `this.parent;` / `this.fall;` no-ops in `TrieNode` constructor — these expression statements do nothing; replace with `this.parent = null` and `this.fall = null`
- [ ] Remove dead `phrase` parameter from `Search.prototype.build(phrase)` — it is never used

## Design

- [ ] Throw instead of `console.log` in the default `exec()` — silent failure when `build()` has not been called is hard to debug; throw `new Error('call build() before exec()')`
- [ ] Replace sparse `childNodes` array with `Map<string, TrieNode>` — indexing by `charCodeAt(0)` creates arrays with thousands of empty slots for Unicode content and makes the BFS loop iterate over all of them
- [ ] Pass `char` directly to `TrieNode` constructor in `createTrie` — `createTrie` currently passes no argument then sets `node.char` manually; should just be `new TrieNode(char)`
- [ ] Store matched phrase on terminal node at insert time — `findPhrase()` walks the parent chain on every match (O(k) per match); storing the phrase string during `add()` makes lookups O(1)
- [ ] Use strict equality (`===`) in `TrieNode.prototype.getChild` — `currentNode.char == str` uses loose equality

## Minor

- [ ] Remove double semicolon in `index.js`
- [ ] Add case-insensitive search option
- [ ] Deduplicate phrases on insert — adding the same phrase twice silently wastes trie nodes
