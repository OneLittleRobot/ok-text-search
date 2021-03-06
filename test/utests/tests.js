import {assert} from 'chai';
import Search from '../../source/search';
import searches from '../content/searches.json';
import testData from '../content/test-data.json';

describe('Custom Aho Corasick Search', function () {
    this.timeout(10000);
    let search;

    testData.forEach(data => {
        it('assert correct phrases are found text ' + data.title, function () {
            search = new Search(searches[data.type]);
            search.build();
            assert.deepEqual(search.exec(data.text), data.result)
        });
    })
})
