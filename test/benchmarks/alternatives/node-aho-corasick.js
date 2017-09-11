var NodeAhoCorasick = require('node-aho-corasick');
module.exports = function (content) {
    const ac = content.reduce((current, phrase) => {
        current.add(phrase);
        return current;
    }, new NodeAhoCorasick());
    ac.build();
    return (str) => {
        return ac.search(str)
    };
}
