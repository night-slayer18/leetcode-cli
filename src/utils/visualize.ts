// Visual test output renderers
import chalk from 'chalk';

type VizType = 'linkedlist' | 'tree' | 'matrix' | 'graph' | 'array' | 'string';

// LeetCode tag to visualization type mapping
const TAG_VISUALIZATION: Record<string, VizType> = {
  'Linked List': 'linkedlist',
  'Doubly-Linked List': 'linkedlist',
  'Tree': 'tree',
  'Binary Tree': 'tree',
  'Binary Search Tree': 'tree',
  'Trie': 'tree',
  'Segment Tree': 'tree',
  'Binary Indexed Tree': 'tree',
  'Graph': 'graph',
  'Matrix': 'matrix',
  'Array': 'array',
  'Hash Table': 'array',
  'Stack': 'array',
  'Queue': 'array',
  'Monotonic Stack': 'array',
  'Monotonic Queue': 'array',
  'Heap (Priority Queue)': 'array',
  'String': 'string',
};

/**
 * Detect visualization type from problem tags
 * Returns null if no supported visualization type found
 */
export function detectVisualizationType(tags: Array<{ name: string }>): VizType | null {
  for (const tag of tags) {
    const vizType = TAG_VISUALIZATION[tag.name];
    if (vizType) return vizType;
  }
  return null; // No matching tag found
}

/**
 * Parse JSON string safely
 */
function parseValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value; // Return as-is if not valid JSON
  }
}

/**
 * Check if value is a 2D array (matrix)
 */
function isMatrix(value: unknown): value is unknown[][] {
  return Array.isArray(value) && value.length > 0 && Array.isArray(value[0]);
}

/**
 * Render array with index boxes
 * Input: [1, 2, 3, 4, 5]
 * Output: 
 *   [0] [1] [2] [3] [4]
 *    1   2   3   4   5
 */
export function visualizeArray(arr: unknown[], expected?: unknown[]): string {
  if (!Array.isArray(arr) || arr.length === 0) {
    return String(arr);
  }

  const maxLen = Math.max(...arr.map(v => String(v).length), 1);
  const cellWidth = Math.max(maxLen, 3);

  // Index row
  const indices = arr.map((_, i) => `[${i}]`.padStart(cellWidth).padEnd(cellWidth)).join(' ');
  
  // Value row with optional diff highlighting
  const values = arr.map((v, i) => {
    const valStr = String(v).padStart(cellWidth).padEnd(cellWidth);
    if (expected && Array.isArray(expected) && expected[i] !== v) {
      return chalk.red.bold(valStr);
    }
    return valStr;
  }).join(' ');

  return `${chalk.gray(indices)}\n${values}`;
}

/**
 * Render linked list with arrows
 * Input: [1, 2, 3, 4, 5]
 * Output: 1 → 2 → 3 → 4 → 5
 */
export function visualizeLinkedList(arr: unknown[], expected?: unknown[]): string {
  if (!Array.isArray(arr)) {
    return String(arr);
  }
  
  if (arr.length === 0) {
    return chalk.gray('(empty)');
  }

  const parts = arr.map((v, i) => {
    const valStr = String(v);
    if (expected && Array.isArray(expected)) {
      if (i >= expected.length || expected[i] !== v) {
        return chalk.red.bold(valStr);
      }
    }
    return valStr;
  });

  return parts.join(chalk.gray(' → '));
}

/**
 * Render binary tree in ASCII
 * Input: [1, 2, 3, null, 4]
 * Output:
 *       1
 *      / \
 *     2   3
 *      \
 *       4
 */
export function visualizeTree(arr: unknown[]): string {
  if (!Array.isArray(arr) || arr.length === 0) {
    return chalk.gray('(empty tree)');
  }

  const lines: string[] = [];
  const height = Math.floor(Math.log2(arr.length)) + 1;
  const maxWidth = Math.pow(2, height) * 3;

  function renderLevel(level: number, startIdx: number, endIdx: number, indent: number): void {
    if (startIdx > arr.length - 1) return;

    const levelNodes: string[] = [];
    const levelBranches: string[] = [];
    const spacing = Math.floor(maxWidth / Math.pow(2, level + 1));
    
    for (let i = startIdx; i <= endIdx && i < arr.length; i++) {
      const val = arr[i];
      const nodeStr = val === null ? ' ' : String(val);
      levelNodes.push(nodeStr.padStart(spacing).padEnd(spacing));
      
      // Add branch indicators
      const leftChild = 2 * i + 1;
      const rightChild = 2 * i + 2;
      const hasLeft = leftChild < arr.length && arr[leftChild] !== null;
      const hasRight = rightChild < arr.length && arr[rightChild] !== null;
      
      if (hasLeft || hasRight) {
        let branch = '';
        if (hasLeft) branch += '/';
        else branch += ' ';
        branch += ' ';
        if (hasRight) branch += '\\';
        else branch += ' ';
        levelBranches.push(branch.padStart(spacing).padEnd(spacing));
      }
    }

    if (levelNodes.length > 0) {
      lines.push(levelNodes.join(''));
      if (levelBranches.length > 0 && level < height - 1) {
        lines.push(levelBranches.join(''));
      }
    }
  }

  for (let level = 0; level < height; level++) {
    const startIdx = Math.pow(2, level) - 1;
    const endIdx = Math.pow(2, level + 1) - 2;
    renderLevel(level, startIdx, endIdx, 0);
  }

  return lines.join('\n');
}

/**
 * Render matrix with grid lines
 * Input: [[1,2,3],[4,5,6]]
 * Output:
 *        0   1   2
 *      ┌───┬───┬───┐
 *    0 │ 1 │ 2 │ 3 │
 *      ├───┼───┼───┤
 *    1 │ 4 │ 5 │ 6 │
 *      └───┴───┴───┘
 */
export function visualizeMatrix(matrix: unknown[][], expected?: unknown[][]): string {
  if (!isMatrix(matrix) || matrix.length === 0) {
    return String(matrix);
  }

  const rows = matrix.length;
  const cols = matrix[0].length;
  const cellWidth = 3;

  const lines: string[] = [];

  // Column headers
  const colHeaders = '    ' + matrix[0].map((_, i) => String(i).padStart(cellWidth).padEnd(cellWidth)).join(' ');
  lines.push(chalk.gray(colHeaders));

  // Top border
  lines.push('    ┌' + Array(cols).fill('───').join('┬') + '┐');

  for (let r = 0; r < rows; r++) {
    // Row content
    const rowContent = matrix[r].map((v, c) => {
      const valStr = String(v).padStart(2);
      if (expected && isMatrix(expected) && expected[r] && expected[r][c] !== v) {
        return chalk.red.bold(valStr);
      }
      return valStr;
    }).join(' │ ');
    
    lines.push(chalk.gray(`  ${r} `) + `│ ${rowContent} │`);

    // Row separator or bottom border
    if (r < rows - 1) {
      lines.push('    ├' + Array(cols).fill('───').join('┼') + '┤');
    } else {
      lines.push('    └' + Array(cols).fill('───').join('┴') + '┘');
    }
  }

  return lines.join('\n');
}

/**
 * Render graph as adjacency list
 */
export function visualizeGraph(adjList: unknown[][]): string {
  if (!isMatrix(adjList)) {
    return String(adjList);
  }

  const lines = adjList.map((neighbors, node) => {
    const neighborStr = Array.isArray(neighbors) 
      ? neighbors.join(', ') 
      : String(neighbors);
    return `  ${chalk.cyan(String(node))} → [${neighborStr}]`;
  });

  return lines.join('\n');
}

/**
 * Main visualization entry point
 */
export function visualizeTestOutput(
  output: string,
  expected: string,
  tags: Array<{ name: string }>
): { outputVis: string; expectedVis: string; matches: boolean; unsupported?: boolean } {
  const outputVal = parseValue(output);
  const expectedVal = parseValue(expected);
  const matches = output === expected;
  const vizType = detectVisualizationType(tags);

  let outputVis: string;
  let expectedVis: string;

  // Auto-detect matrix even without tag
  if (isMatrix(outputVal)) {
    const expectedMatrix = isMatrix(expectedVal) ? expectedVal : undefined;
    outputVis = visualizeMatrix(outputVal, expectedMatrix);
    expectedVis = isMatrix(expectedVal) ? visualizeMatrix(expectedVal) : String(expected);
    return { outputVis, expectedVis, matches };
  }

  // No matching visualization type
  if (vizType === null) {
    return {
      outputVis: String(output),
      expectedVis: String(expected),
      matches,
      unsupported: true,
    };
  }

  switch (vizType) {
    case 'linkedlist':
      outputVis = visualizeLinkedList(outputVal as unknown[], expectedVal as unknown[]);
      expectedVis = visualizeLinkedList(expectedVal as unknown[]);
      break;
    case 'tree':
      outputVis = visualizeTree(outputVal as unknown[]);
      expectedVis = visualizeTree(expectedVal as unknown[]);
      break;
    case 'graph':
      outputVis = visualizeGraph(outputVal as unknown[][]);
      expectedVis = visualizeGraph(expectedVal as unknown[][]);
      break;
    case 'matrix':
      const expMatrix = isMatrix(expectedVal) ? expectedVal : undefined;
      outputVis = visualizeMatrix(outputVal as unknown[][], expMatrix);
      expectedVis = isMatrix(expectedVal) ? visualizeMatrix(expectedVal) : String(expected);
      break;
    case 'array':
    case 'string':
      if (Array.isArray(outputVal)) {
        outputVis = visualizeArray(outputVal, expectedVal as unknown[]);
        expectedVis = Array.isArray(expectedVal) 
          ? visualizeArray(expectedVal) 
          : String(expected);
      } else {
        // Scalar values or strings - show with diff highlighting
        outputVis = matches ? String(output) : chalk.red.bold(String(output));
        expectedVis = String(expected);
      }
      break;
  }

  return { outputVis, expectedVis, matches };
}
