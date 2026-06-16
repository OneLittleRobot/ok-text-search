import { assert } from 'chai';
import { Search } from '../src/search';
import type { SearchResult } from '../src/search';

interface TestCase {
    title: string;
    type: string;
    text: string;
    result: SearchResult[];
}

/* eslint-disable @typescript-eslint/no-require-imports */
const searches: Record<string, string[]> = require('./content/searches.json');
const testData: TestCase[] = require('./content/test-data.json');

describe('Search', function () {
    this.timeout(10000);

    describe('data-driven test cases', function () {
        testData.forEach(data => {
            it(data.title, function () {
                const search = new Search(searches[data.type]);
                search.build();
                assert.deepEqual(search.exec(data.text), data.result);
            });
        });
    });

    describe('error handling', function () {
        it('throws when exec() is called before build()', function () {
            const search = new Search(['hello']);
            assert.throws(() => search.exec('hello world'), Error, 'call build() before exec()');
        });

        it('throws when add() is called after build()', function () {
            const search = new Search(['hello']);
            search.build();
            assert.throws(() => search.add('world'), Error, 'Cannot add phrases after build()');
        });
    });

    describe('edge cases', function () {
        it('returns empty array for empty text', function () {
            const search = new Search(['hello']);
            search.build();
            assert.deepEqual(search.exec(''), []);
        });

        it('works with no phrases', function () {
            const search = new Search();
            search.build();
            assert.deepEqual(search.exec('hello world'), []);
        });

        it('handles duplicate phrases without producing duplicate results', function () {
            const search = new Search(['hello', 'hello']);
            search.build();
            assert.deepEqual(search.exec('say hello now'), [{ index: 4, text: 'hello' }]);
        });

        it('returns empty array when no phrases match', function () {
            const search = new Search(['foo', 'bar']);
            search.build();
            assert.deepEqual(search.exec('baz qux'), []);
        });

        it('finds match at start of text', function () {
            const search = new Search(['hello']);
            search.build();
            assert.deepEqual(search.exec('hello world'), [{ index: 0, text: 'hello' }]);
        });

        it('finds match at end of text', function () {
            const search = new Search(['world']);
            search.build();
            assert.deepEqual(search.exec('hello world'), [{ index: 6, text: 'world' }]);
        });

        it('finds both prefix and full match when one pattern is a prefix of another', function () {
            const search = new Search(['he', 'hello']);
            search.build();
            assert.deepEqual(search.exec('hello'), [
                { index: 0, text: 'he' },
                { index: 0, text: 'hello' },
            ]);
        });

        it('add() before build() works correctly', function () {
            const search = new Search(['hello']);
            search.add('world');
            search.build();
            const results = search.exec('hello world');
            assert.deepEqual(results, [
                { index: 0, text: 'hello' },
                { index: 6, text: 'world' },
            ]);
        });
    });

    describe('unicode support', function () {
        it('matches an emoji pattern', function () {
            const search = new Search(['🎉']);
            search.build();
            assert.deepEqual(search.exec('hello 🎉 world'), [{ index: 6, text: '🎉' }]);
        });

        it('reports correct code-point index in text containing emoji', function () {
            const search = new Search(['world']);
            search.build();
            // '🎉' is one code point, so 'world' starts at code-point index 8
            assert.deepEqual(search.exec('🎉 hello world'), [{ index: 8, text: 'world' }]);
        });

        it('matches a multi-emoji pattern', function () {
            const search = new Search(['🎉🎊']);
            search.build();
            assert.deepEqual(search.exec('party 🎉🎊 time'), [{ index: 6, text: '🎉🎊' }]);
        });
    });
});
