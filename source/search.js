const createTrie = function (char) {
    const node = new TrieNode();
    node.char = char;
    return node;
};

const findPhrase = function (currentNode) {
    let tmp = '';
    while (currentNode.parent) {
        tmp = currentNode.char + tmp;
        currentNode = currentNode.parent;
    }
    return tmp;
};

const TrieNode = function (char) {
    this.childNodes = [];
    this.char = char;
    this.isEnd = false;
    this.parent;
    this.fall;
};

TrieNode.prototype.getChild = function (str) {
    const currentNode = this.childNodes[str.charCodeAt(0)];
    return !currentNode ? null : (currentNode.char == str) ? currentNode : null;
};

TrieNode.prototype.add = function (str) {
    let currentNode = this.getChild(str.charAt(0));
    if (!currentNode) {
        currentNode = createTrie(str.charAt(0));
        currentNode.parent = this;
        this.childNodes[str.charCodeAt(0)] = currentNode;
    }
    if (str.length > 1) {
        currentNode.add(str.substring(1, str.length));
    } else {
        currentNode.isEnd = true;
    }
}


const ahoCorasick = function (trie) {
    let queue = []
    trie.fall = trie;
    queue.push(trie);
    while (queue.length > 0) {
        let node = queue.shift();
        let currentNode;
        let i = node.childNodes.length;
        while (i--) {
            currentNode = node.childNodes[i];
            if (currentNode) {
                queue.push(currentNode);
            }
        }
        if (node !== trie) {
            let fall = node.parent.fall;
            while (!fall.getChild(node.char) && fall !== trie) {
                fall = fall.fall;
            }
            node.fall = fall.getChild(node.char) || trie;

            if (node.fall === node) {
                node.fall = trie;
            }
        }
    }

    return function (text) {
        let results = [];
        let currentState = trie;
        let node;
        let currentNode;
        let currentChar;
        let phrase;
        const arr = text.split('').reverse();

        const len = arr.length - 1;
        let i = arr.length;
        while (i--) {
            node = currentState;
            currentChar = arr[i];

            // move on falls right child or root is found
            while (node.char && !node.getChild(currentChar)) {
                node = node.fall;
            }

            node = node.getChild(currentChar) || trie;

            currentNode = node;
            //move on falls to root, add all found to the results
            while (currentNode.char) {
                if (currentNode.isEnd) {
                    phrase = findPhrase(currentNode)
                    results.push({
                        index: 1 + len - (i + phrase.length),
                        text: phrase
                    });
                }
                currentNode = currentNode.fall;
            }
            currentState = node;
        }

        return results;
    }
};

const Search = function (content = []) {
    this._trie = content.reduce(function (current, phrase) {
        current.add(phrase);
        return current;
    }, new TrieNode());
};

Search.prototype.add = function (phrase) {
    this._trie.add(phrase);
};

Search.prototype.build = function (phrase) {
    this.exec = ahoCorasick(this._trie);
};

Search.prototype.exec = function () {
    console.log('please build before searching');
    return [];
};

export default Search;
