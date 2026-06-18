export interface SearchResult {
    index: number;
    text: string;
}

export interface SearchOptions {
    caseInsensitive?: boolean;
}

class TrieNode {
    readonly childNodes: Map<number, TrieNode> = new Map();
    isEnd: boolean = false;
    fall: TrieNode | null = null;
    dict: TrieNode | null = null;
    phrase: string | null = null;
    phraseLength: number = 0;

    getChild(cp: number): TrieNode | null {
        return this.childNodes.get(cp) ?? null;
    }
}

function insertPhrase(root: TrieNode, phrase: string, normalize: (s: string) => string): void {
    const normalized = normalize(phrase);
    let node = root;
    let length = 0;
    for (let si = 0; si < normalized.length; ) {
        const cp = normalized.codePointAt(si)!;
        si += cp > 0xFFFF ? 2 : 1;
        length++;
        let child = node.getChild(cp);
        if (!child) {
            child = new TrieNode();
            node.childNodes.set(cp, child);
        }
        node = child;
    }
    node.isEnd = true;
    node.phrase = phrase;
    node.phraseLength = length;
}

function buildFailureLinks(trie: TrieNode): void {
    const queue: TrieNode[] = [trie];
    trie.fall = trie;
    let head = 0;

    while (head < queue.length) {
        const node = queue[head++];
        for (const [cp, child] of node.childNodes) {
            if (node === trie) {
                child.fall = trie;
            } else {
                let fall = node.fall!;
                while (fall !== trie && !fall.getChild(cp)) {
                    fall = fall.fall!;
                }
                child.fall = fall.getChild(cp) ?? trie;
                if (child.fall === child) {
                    child.fall = trie;
                }
            }
            child.dict = child.fall!.isEnd ? child.fall : child.fall!.dict;
            queue.push(child);
        }
    }
}

function runSearch(trie: TrieNode, text: string, normalize: (s: string) => string): SearchResult[] {
    const results: SearchResult[] = [];
    const normalized = normalize(text);
    let state = trie;
    let i = 0;

    for (let si = 0; si < normalized.length; ) {
        const cp = normalized.codePointAt(si)!;
        si += cp > 0xFFFF ? 2 : 1;

        while (state !== trie && !state.getChild(cp)) {
            state = state.fall!;
        }

        state = state.getChild(cp) ?? trie;

        let node: TrieNode | null = state.isEnd ? state : state.dict;
        while (node !== null) {
            results.push({
                index: i - node.phraseLength + 1,
                text: node.phrase!,
            });
            node = node.dict;
        }

        i++;
    }

    return results;
}

export class Search {
    private readonly _trie: TrieNode;
    private readonly _normalize: (s: string) => string;
    private _built: boolean = false;

    constructor(content: string[] = [], options: SearchOptions = {}) {
        this._normalize = options.caseInsensitive ? (s) => s.toLowerCase() : (s) => s;
        this._trie = new TrieNode();
        for (const phrase of content) {
            insertPhrase(this._trie, phrase, this._normalize);
        }
    }

    add(phrase: string): void {
        if (this._built) {
            throw new Error('Cannot add phrases after build(); create a new Search instance');
        }
        insertPhrase(this._trie, phrase, this._normalize);
    }

    build(): void {
        buildFailureLinks(this._trie);
        this._built = true;
    }

    exec(text: string): SearchResult[] {
        if (!this._built) {
            throw new Error('call build() before exec()');
        }
        return runSearch(this._trie, text, this._normalize);
    }

    execFirst(text: string): SearchResult | null {
        if (!this._built) {
            throw new Error('call build() before execFirst()');
        }
        const normalized = this._normalize(text);
        let state = this._trie;
        let i = 0;

        for (let si = 0; si < normalized.length; ) {
            const cp = normalized.codePointAt(si)!;
            si += cp > 0xFFFF ? 2 : 1;

            while (state !== this._trie && !state.getChild(cp)) {
                state = state.fall!;
            }

            state = state.getChild(cp) ?? this._trie;

            const node = state.isEnd ? state : state.dict;
            if (node !== null) {
                return {
                    index: i - node.phraseLength + 1,
                    text: node.phrase!,
                };
            }

            i++;
        }

        return null;
    }
}

export default Search;
