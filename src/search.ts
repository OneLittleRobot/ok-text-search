export interface SearchResult {
    index: number;
    text: string;
}

class TrieNode {
    readonly childNodes: Map<string, TrieNode> = new Map();
    readonly char: string | null;
    isEnd: boolean = false;
    parent: TrieNode | null = null;
    fall: TrieNode | null = null;
    phrase: string | null = null;
    phraseLength: number = 0;

    constructor(char: string | null = null) {
        this.char = char;
    }

    getChild(char: string): TrieNode | null {
        return this.childNodes.get(char) ?? null;
    }
}

function insertPhrase(root: TrieNode, phrase: string): void {
    const chars = [...phrase];
    let node = root;
    for (const char of chars) {
        let child = node.getChild(char);
        if (!child) {
            child = new TrieNode(char);
            child.parent = node;
            node.childNodes.set(char, child);
        }
        node = child;
    }
    node.isEnd = true;
    node.phrase = phrase;
    node.phraseLength = chars.length;
}

function buildFailureLinks(trie: TrieNode): void {
    const queue: TrieNode[] = [trie];
    trie.fall = trie;

    while (queue.length > 0) {
        const node = queue.shift()!;
        for (const [char, child] of node.childNodes) {
            if (node === trie) {
                child.fall = trie;
            } else {
                let fall = node.fall!;
                while (fall !== trie && !fall.getChild(char)) {
                    fall = fall.fall!;
                }
                child.fall = fall.getChild(char) ?? trie;
                if (child.fall === child) {
                    child.fall = trie;
                }
            }
            queue.push(child);
        }
    }
}

function runSearch(trie: TrieNode, text: string): SearchResult[] {
    const results: SearchResult[] = [];
    const chars = [...text];
    let state = trie;

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];

        while (state !== trie && !state.getChild(char)) {
            state = state.fall!;
        }

        state = state.getChild(char) ?? trie;

        let node = state;
        while (node !== trie) {
            if (node.isEnd) {
                results.push({
                    index: i - node.phraseLength + 1,
                    text: node.phrase!,
                });
            }
            node = node.fall!;
        }
    }

    return results;
}

export class Search {
    private readonly _trie: TrieNode;
    private _built: boolean = false;

    constructor(content: string[] = []) {
        this._trie = new TrieNode();
        for (const phrase of content) {
            insertPhrase(this._trie, phrase);
        }
    }

    add(phrase: string): void {
        if (this._built) {
            throw new Error('Cannot add phrases after build(); create a new Search instance');
        }
        insertPhrase(this._trie, phrase);
    }

    build(): void {
        buildFailureLinks(this._trie);
        this._built = true;
    }

    exec(text: string): SearchResult[] {
        if (!this._built) {
            throw new Error('call build() before exec()');
        }
        return runSearch(this._trie, text);
    }
}

export default Search;
