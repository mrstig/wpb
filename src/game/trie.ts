export interface TrieNode {
  readonly children: Map<string, TrieNode>;
  isWord: boolean;
}

export function createTrieNode(): TrieNode {
  return { children: new Map(), isWord: false };
}

/** Inserts every word into a trie for fast prefix-walks while solving. */
export function buildTrie(words: Iterable<string>): TrieNode {
  const root = createTrieNode();
  for (const raw of words) {
    const word = raw.toUpperCase();
    let node = root;
    for (const char of word) {
      let child = node.children.get(char);
      if (!child) {
        child = createTrieNode();
        node.children.set(char, child);
      }
      node = child;
    }
    node.isWord = true;
  }
  return root;
}

/** Walks the trie along `word`; returns the final node or undefined. */
export function walk(root: TrieNode, word: string): TrieNode | undefined {
  let node: TrieNode | undefined = root;
  for (const char of word) {
    node = node?.children.get(char.toUpperCase());
    if (!node) return undefined;
  }
  return node;
}

export function hasWord(root: TrieNode, word: string): boolean {
  return walk(root, word)?.isWord ?? false;
}
