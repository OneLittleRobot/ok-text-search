# OK Text Search  [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url]

A module for searching for text. Useful if you need to search a large piece of text for multiple strings.

Don't know if it's the fastest but it's OK. 

```sh
npm install ok-text-search
```

```js
import OKTextSearch('ok-text-search');

const textSearch= new OKTextSearch(['something','another thing']);
textSearch.add('yet another thing');

textSearch.build();

const results = textSearch.exec('Lorem ipsum dolor something, consectetur adipiscing elit. In sem felis, tincidunt vitae orci et, ornare malesuada ante. Cras ultrices interdum leo id imperdiet. Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
//[{index:18, text:'something'}]
```


[travis-url]: http://travis-ci.org/OneLittleRobot/ok-text-search
[travis-image]: https://secure.travis-ci.org/OneLittleRobot/ok-text-search.svg?branch=master
[npm-url]: https://npmjs.org/package/ok-text-search
[npm-image]: https://badge.fury.io/js/ok-text-search.svg
