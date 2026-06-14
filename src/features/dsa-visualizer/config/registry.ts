import type { VisualizerConfig } from '../types'

import {
  generateArrayAccess,
  generateArrayUpdate,
  generateArrayInsert,
  generateArrayDelete,
  generateArraySearch,
} from '../data-structures/array'
import {
  generateLinkedListInsertHead,
  generateLinkedListInsertTail,
  generateLinkedListDelete,
  generateLinkedListSearch,
} from '../data-structures/linked-list'
import {
  generateStackPush,
  generateStackPop,
  generateStackPeek,
} from '../data-structures/stack'
import {
  generateQueueEnqueue,
  generateQueueDequeue,
} from '../data-structures/queue'
import {
  generateHashTableInsert,
  generateHashTableSearch,
  generateHashTableDelete,
} from '../data-structures/hash-table'
import {
  generateBSTInsert,
  generateBSTSearch,
  generateBSTDelete,
} from '../data-structures/bst'
import {
  generateAVLInsert,
  generateAVLInsertRR,
  generateAVLInsertLR,
  generateAVLInsertRL,
  generateAVLDelete,
} from '../data-structures/avl'
import {
  generateHeapInsert,
  generateHeapExtract,
} from '../data-structures/heap'
import {
  generateTrieInsert,
  generateTrieSearch,
  generateTriePrefixSearch,
} from '../data-structures/trie'
import {
  generateGraphAddNode,
  generateGraphAddEdge,
} from '../data-structures/graph-ds'
import {
  generateUnionFindFind,
  generateUnionFindUnion,
} from '../data-structures/union-find'

import {
  generateLinearSearch,
  generateBinarySearch,
} from '../algorithms/searching'
import {
  generateBubbleSort,
  generateSelectionSort,
  generateInsertionSort,
  generateMergeSort,
  generateQuickSort,
  generateHeapSort,
} from '../algorithms/sorting'
import {
  generateFactorial,
  generateFibonacci,
  generateTowerOfHanoi,
} from '../algorithms/recursion'
import {
  generatePermutations,
  generateSubsets,
  generateNQueens,
} from '../algorithms/backtracking'
import {
  generateDpFibonacci,
  generateClimbingStairs,
  generateCoinChange,
  generateKnapsack,
  generateLCS,
} from '../algorithms/dynamic-programming'
import {
  generateBFS,
  generateDFS,
  generateTopologicalSort,
  generateDijkstra,
  generatePrim,
  generateKruskal,
} from '../algorithms/graph'
import {
  generateKMP,
  generateRabinKarp,
} from '../algorithms/string'

export const VISUALIZER_REGISTRY: VisualizerConfig[] = [
  // Arrays
  { id: 'array-access', title: 'Array - Access', category: 'data-structure', subcategory: 'Array', description: 'Access element by index', rendererType: 'array', generate: generateArrayAccess },
  { id: 'array-update', title: 'Array - Update', category: 'data-structure', subcategory: 'Array', description: 'Update element at index', rendererType: 'array', generate: generateArrayUpdate },
  { id: 'array-insert', title: 'Array - Insert', category: 'data-structure', subcategory: 'Array', description: 'Insert element at index', rendererType: 'array', generate: generateArrayInsert },
  { id: 'array-delete', title: 'Array - Delete', category: 'data-structure', subcategory: 'Array', description: 'Delete element at index', rendererType: 'array', generate: generateArrayDelete },
  { id: 'array-search', title: 'Array - Search', category: 'data-structure', subcategory: 'Array', description: 'Search for element in array', rendererType: 'array', generate: generateArraySearch },

  // Linked List
  { id: 'll-insert-head-singly', title: 'Linked List - Insert Head (Singly)', category: 'data-structure', subcategory: 'Linked List', description: 'Insert at head of singly linked list', rendererType: 'linked-list', generate: () => generateLinkedListInsertHead('singly') },
  { id: 'll-insert-head-doubly', title: 'Linked List - Insert Head (Doubly)', category: 'data-structure', subcategory: 'Linked List', description: 'Insert at head of doubly linked list', rendererType: 'linked-list', generate: () => generateLinkedListInsertHead('doubly') },
  { id: 'll-insert-tail-singly', title: 'Linked List - Insert Tail (Singly)', category: 'data-structure', subcategory: 'Linked List', description: 'Insert at tail of singly linked list', rendererType: 'linked-list', generate: () => generateLinkedListInsertTail('singly') },
  { id: 'll-insert-tail-doubly', title: 'Linked List - Insert Tail (Doubly)', category: 'data-structure', subcategory: 'Linked List', description: 'Insert at tail of doubly linked list', rendererType: 'linked-list', generate: () => generateLinkedListInsertTail('doubly') },
  { id: 'll-delete-singly', title: 'Linked List - Delete (Singly)', category: 'data-structure', subcategory: 'Linked List', description: 'Delete node from singly linked list', rendererType: 'linked-list', generate: () => generateLinkedListDelete('singly') },
  { id: 'll-delete-doubly', title: 'Linked List - Delete (Doubly)', category: 'data-structure', subcategory: 'Linked List', description: 'Delete node from doubly linked list', rendererType: 'linked-list', generate: () => generateLinkedListDelete('doubly') },
  { id: 'll-search-singly', title: 'Linked List - Search (Singly)', category: 'data-structure', subcategory: 'Linked List', description: 'Search in singly linked list', rendererType: 'linked-list', generate: () => generateLinkedListSearch('singly') },
  { id: 'll-search-doubly', title: 'Linked List - Search (Doubly)', category: 'data-structure', subcategory: 'Linked List', description: 'Search in doubly linked list', rendererType: 'linked-list', generate: () => generateLinkedListSearch('doubly') },

  // Stack
  { id: 'stack-push', title: 'Stack - Push', category: 'data-structure', subcategory: 'Stack', description: 'Push element onto stack', rendererType: 'stack', generate: generateStackPush },
  { id: 'stack-pop', title: 'Stack - Pop', category: 'data-structure', subcategory: 'Stack', description: 'Pop element from stack', rendererType: 'stack', generate: generateStackPop },
  { id: 'stack-peek', title: 'Stack - Peek', category: 'data-structure', subcategory: 'Stack', description: 'Peek top element without removing', rendererType: 'stack', generate: generateStackPeek },

  // Queue
  { id: 'queue-enqueue', title: 'Queue - Enqueue', category: 'data-structure', subcategory: 'Queue', description: 'Add element to rear of queue', rendererType: 'queue', generate: generateQueueEnqueue },
  { id: 'queue-dequeue', title: 'Queue - Dequeue', category: 'data-structure', subcategory: 'Queue', description: 'Remove element from front of queue', rendererType: 'queue', generate: generateQueueDequeue },

  // Hash Table
  { id: 'hash-insert', title: 'Hash Table - Insert', category: 'data-structure', subcategory: 'Hash Table', description: 'Insert with chaining collision handling', rendererType: 'hash-table', generate: generateHashTableInsert },
  { id: 'hash-search', title: 'Hash Table - Search', category: 'data-structure', subcategory: 'Hash Table', description: 'Search key in hash table', rendererType: 'hash-table', generate: generateHashTableSearch },
  { id: 'hash-delete', title: 'Hash Table - Delete', category: 'data-structure', subcategory: 'Hash Table', description: 'Delete key from hash table', rendererType: 'hash-table', generate: generateHashTableDelete },

  // BST
  { id: 'bst-insert', title: 'BST - Insert', category: 'data-structure', subcategory: 'Binary Search Tree', description: 'Insert into binary search tree', rendererType: 'tree', generate: generateBSTInsert },
  { id: 'bst-search', title: 'BST - Search', category: 'data-structure', subcategory: 'Binary Search Tree', description: 'Search in binary search tree', rendererType: 'tree', generate: generateBSTSearch },
  { id: 'bst-delete', title: 'BST - Delete', category: 'data-structure', subcategory: 'Binary Search Tree', description: 'Delete from binary search tree', rendererType: 'tree', generate: generateBSTDelete },

  // AVL
  { id: 'avl-insert-ll', title: 'AVL - Insert (LL Rotation)', category: 'data-structure', subcategory: 'AVL Tree', description: 'Insert causing left-left rotation', rendererType: 'tree', generate: generateAVLInsert },
  { id: 'avl-insert-rr', title: 'AVL - Insert (RR Rotation)', category: 'data-structure', subcategory: 'AVL Tree', description: 'Insert causing right-right rotation', rendererType: 'tree', generate: generateAVLInsertRR },
  { id: 'avl-insert-lr', title: 'AVL - Insert (LR Rotation)', category: 'data-structure', subcategory: 'AVL Tree', description: 'Insert causing left-right rotation', rendererType: 'tree', generate: generateAVLInsertLR },
  { id: 'avl-insert-rl', title: 'AVL - Insert (RL Rotation)', category: 'data-structure', subcategory: 'AVL Tree', description: 'Insert causing right-left rotation', rendererType: 'tree', generate: generateAVLInsertRL },
  { id: 'avl-delete', title: 'AVL - Delete', category: 'data-structure', subcategory: 'AVL Tree', description: 'Delete with rebalancing', rendererType: 'tree', generate: generateAVLDelete },

  // Heap
  { id: 'heap-insert-min', title: 'Min Heap - Insert', category: 'data-structure', subcategory: 'Heap', description: 'Insert into min heap', rendererType: 'heap', generate: () => generateHeapInsert('min') },
  { id: 'heap-insert-max', title: 'Max Heap - Insert', category: 'data-structure', subcategory: 'Heap', description: 'Insert into max heap', rendererType: 'heap', generate: () => generateHeapInsert('max') },
  { id: 'heap-extract-min', title: 'Min Heap - Extract', category: 'data-structure', subcategory: 'Heap', description: 'Extract minimum from heap', rendererType: 'heap', generate: () => generateHeapExtract('min') },
  { id: 'heap-extract-max', title: 'Max Heap - Extract', category: 'data-structure', subcategory: 'Heap', description: 'Extract maximum from heap', rendererType: 'heap', generate: () => generateHeapExtract('max') },

  // Trie
  { id: 'trie-insert', title: 'Trie - Insert', category: 'data-structure', subcategory: 'Trie', description: 'Insert word into trie', rendererType: 'trie', generate: generateTrieInsert },
  { id: 'trie-search', title: 'Trie - Search', category: 'data-structure', subcategory: 'Trie', description: 'Search word in trie', rendererType: 'trie', generate: generateTrieSearch },
  { id: 'trie-prefix', title: 'Trie - Prefix Search', category: 'data-structure', subcategory: 'Trie', description: 'Find all words with prefix', rendererType: 'trie', generate: generateTriePrefixSearch },

  // Graph DS
  { id: 'graph-add-node-directed', title: 'Graph - Add Node (Directed)', category: 'data-structure', subcategory: 'Graph', description: 'Add node to directed graph', rendererType: 'graph', generate: () => generateGraphAddNode(true) },
  { id: 'graph-add-node-undirected', title: 'Graph - Add Node (Undirected)', category: 'data-structure', subcategory: 'Graph', description: 'Add node to undirected graph', rendererType: 'graph', generate: () => generateGraphAddNode(false) },
  { id: 'graph-add-edge-directed', title: 'Graph - Add Edge (Directed)', category: 'data-structure', subcategory: 'Graph', description: 'Add edge to directed graph', rendererType: 'graph', generate: () => generateGraphAddEdge(true) },
  { id: 'graph-add-edge-undirected', title: 'Graph - Add Edge (Undirected)', category: 'data-structure', subcategory: 'Graph', description: 'Add edge to undirected graph', rendererType: 'graph', generate: () => generateGraphAddEdge(false) },

  // Union Find
  { id: 'uf-find', title: 'Union Find - Find', category: 'data-structure', subcategory: 'Union Find', description: 'Find with path compression', rendererType: 'union-find', generate: generateUnionFindFind },
  { id: 'uf-union', title: 'Union Find - Union', category: 'data-structure', subcategory: 'Union Find', description: 'Union by rank', rendererType: 'union-find', generate: generateUnionFindUnion },

  // Searching
  { id: 'linear-search', title: 'Linear Search', category: 'algorithm', subcategory: 'Searching', description: 'Sequential search through array', rendererType: 'array', generate: generateLinearSearch },
  { id: 'binary-search', title: 'Binary Search', category: 'algorithm', subcategory: 'Searching', description: 'Divide and conquer search on sorted array', rendererType: 'array', generate: generateBinarySearch },

  // Sorting
  { id: 'bubble-sort', title: 'Bubble Sort', category: 'algorithm', subcategory: 'Sorting', description: 'Repeatedly swap adjacent elements', rendererType: 'array', generate: generateBubbleSort },
  { id: 'selection-sort', title: 'Selection Sort', category: 'algorithm', subcategory: 'Sorting', description: 'Select minimum and place at front', rendererType: 'array', generate: generateSelectionSort },
  { id: 'insertion-sort', title: 'Insertion Sort', category: 'algorithm', subcategory: 'Sorting', description: 'Build sorted portion incrementally', rendererType: 'array', generate: generateInsertionSort },
  { id: 'merge-sort', title: 'Merge Sort', category: 'algorithm', subcategory: 'Sorting', description: 'Divide, sort, and merge', rendererType: 'array', generate: generateMergeSort },
  { id: 'quick-sort', title: 'Quick Sort', category: 'algorithm', subcategory: 'Sorting', description: 'Partition around pivot', rendererType: 'array', generate: generateQuickSort },
  { id: 'heap-sort', title: 'Heap Sort', category: 'algorithm', subcategory: 'Sorting', description: 'Sort using heap data structure', rendererType: 'array', generate: generateHeapSort },

  // Recursion
  { id: 'factorial', title: 'Factorial', category: 'algorithm', subcategory: 'Recursion', description: 'Recursive factorial computation', rendererType: 'recursion-tree', generate: generateFactorial },
  { id: 'fibonacci-recursion', title: 'Fibonacci (Recursion)', category: 'algorithm', subcategory: 'Recursion', description: 'Naive recursive fibonacci', rendererType: 'recursion-tree', generate: generateFibonacci },
  { id: 'tower-of-hanoi', title: 'Tower of Hanoi', category: 'algorithm', subcategory: 'Recursion', description: 'Classic recursive puzzle', rendererType: 'recursion-tree', generate: generateTowerOfHanoi },

  // Backtracking
  { id: 'permutations', title: 'Permutations', category: 'algorithm', subcategory: 'Backtracking', description: 'Generate all permutations', rendererType: 'decision-tree', generate: generatePermutations },
  { id: 'subsets', title: 'Subsets', category: 'algorithm', subcategory: 'Backtracking', description: 'Generate all subsets', rendererType: 'decision-tree', generate: generateSubsets },
  { id: 'n-queens', title: 'N Queens', category: 'algorithm', subcategory: 'Backtracking', description: 'Place N queens on chessboard', rendererType: 'decision-tree', generate: generateNQueens },

  // Dynamic Programming
  { id: 'dp-fibonacci', title: 'DP - Fibonacci', category: 'algorithm', subcategory: 'Dynamic Programming', description: 'Bottom-up fibonacci', rendererType: 'dp-table', generate: generateDpFibonacci },
  { id: 'climbing-stairs', title: 'Climbing Stairs', category: 'algorithm', subcategory: 'Dynamic Programming', description: 'Count ways to climb stairs', rendererType: 'dp-table', generate: generateClimbingStairs },
  { id: 'coin-change', title: 'Coin Change', category: 'algorithm', subcategory: 'Dynamic Programming', description: 'Minimum coins for amount', rendererType: 'dp-table', generate: generateCoinChange },
  { id: 'knapsack', title: 'Knapsack', category: 'algorithm', subcategory: 'Dynamic Programming', description: '0-1 knapsack problem', rendererType: 'dp-table', generate: generateKnapsack },
  { id: 'lcs', title: 'Longest Common Subsequence', category: 'algorithm', subcategory: 'Dynamic Programming', description: 'LCS of two strings', rendererType: 'dp-table', generate: generateLCS },

  // Graph Algorithms
  { id: 'bfs', title: 'BFS', category: 'algorithm', subcategory: 'Graph Algorithms', description: 'Breadth-first search', rendererType: 'graph', generate: generateBFS },
  { id: 'dfs', title: 'DFS', category: 'algorithm', subcategory: 'Graph Algorithms', description: 'Depth-first search', rendererType: 'graph', generate: generateDFS },
  { id: 'topological-sort', title: 'Topological Sort', category: 'algorithm', subcategory: 'Graph Algorithms', description: 'Linear ordering of DAG', rendererType: 'graph', generate: generateTopologicalSort },
  { id: 'dijkstra', title: 'Dijkstra', category: 'algorithm', subcategory: 'Graph Algorithms', description: 'Shortest path from source', rendererType: 'graph', generate: generateDijkstra },
  { id: 'prim', title: "Prim's Algorithm", category: 'algorithm', subcategory: 'Graph Algorithms', description: 'Minimum spanning tree', rendererType: 'graph', generate: generatePrim },
  { id: 'kruskal', title: "Kruskal's Algorithm", category: 'algorithm', subcategory: 'Graph Algorithms', description: 'MST via edge sorting', rendererType: 'graph', generate: generateKruskal },

  // String Algorithms
  { id: 'kmp', title: 'KMP', category: 'algorithm', subcategory: 'String Algorithms', description: 'Knuth-Morris-Pratt pattern matching', rendererType: 'string-match', generate: generateKMP },
  { id: 'rabin-karp', title: 'Rabin-Karp', category: 'algorithm', subcategory: 'String Algorithms', description: 'Rolling hash pattern matching', rendererType: 'string-match', generate: generateRabinKarp },
]

export function getVisualizerById(id: string): VisualizerConfig | undefined {
  return VISUALIZER_REGISTRY.find((v) => v.id === id)
}

export function getGroupedVisualizers(): Record<string, VisualizerConfig[]> {
  const groups: Record<string, VisualizerConfig[]> = {}
  for (const v of VISUALIZER_REGISTRY) {
    const key = v.category === 'data-structure' ? `Data Structures / ${v.subcategory}` : `Algorithms / ${v.subcategory}`
    if (!groups[key]) groups[key] = []
    groups[key].push(v)
  }
  return groups
}
