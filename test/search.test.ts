import { assert } from 'chai';
import { Search } from '../src/search';
import type { SearchResult } from '../src/search';
import type { SearchOptions } from '../src/search';

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

    describe('case-insensitive search', function () {
        const ci: SearchOptions = { caseInsensitive: true };

        it('matches uppercase text against a lowercase phrase', function () {
            const search = new Search(['hello'], ci);
            search.build();
            assert.deepEqual(search.exec('HELLO WORLD'), [{ index: 0, text: 'hello' }]);
        });

        it('matches lowercase text against a mixed-case phrase', function () {
            const search = new Search(['Hello World'], ci);
            search.build();
            assert.deepEqual(search.exec('hello world'), [{ index: 0, text: 'Hello World' }]);
        });

        it('returns the original phrase casing in results', function () {
            const search = new Search(['Star Wars'], ci);
            search.build();
            assert.deepEqual(search.exec('I love star wars!'), [{ index: 7, text: 'Star Wars' }]);
        });

        it('is case-sensitive by default', function () {
            const search = new Search(['hello']);
            search.build();
            assert.deepEqual(search.exec('HELLO'), []);
        });

        it('finds multiple matches with mixed casing in text', function () {
            const search = new Search(['cat'], ci);
            search.build();
            assert.deepEqual(search.exec('Cat CAT cat'), [
                { index: 0, text: 'cat' },
                { index: 4, text: 'cat' },
                { index: 8, text: 'cat' },
            ]);
        });

        it('add() respects the caseInsensitive option', function () {
            const search = new Search([], ci);
            search.add('Blueberry');
            search.build();
            assert.deepEqual(search.exec('I love BLUEBERRY pie'), [{ index: 7, text: 'Blueberry' }]);
        });

        it('reports correct index when match is in the middle of text', function () {
            const search = new Search(['world'], ci);
            search.build();
            assert.deepEqual(search.exec('hello WORLD'), [{ index: 6, text: 'world' }]);
        });
    });
});
