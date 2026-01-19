// Visualize utility tests
import { describe, it, expect } from 'vitest';
import {
  detectVisualizationType,
  visualizeArray,
  visualizeLinkedList,
  visualizeTestOutput,
} from '../../utils/visualize.js';

describe('Visualize Utilities', () => {
  describe('detectVisualizationType', () => {
    it('should detect linked list from tags', () => {
      expect(detectVisualizationType([{ name: 'Linked List' }])).toBe('linkedlist');
      expect(detectVisualizationType([{ name: 'Doubly-Linked List' }])).toBe('linkedlist');
    });

    it('should detect tree from tags', () => {
      expect(detectVisualizationType([{ name: 'Tree' }])).toBe('tree');
      expect(detectVisualizationType([{ name: 'Binary Tree' }])).toBe('tree');
      expect(detectVisualizationType([{ name: 'Binary Search Tree' }])).toBe('tree');
      expect(detectVisualizationType([{ name: 'Trie' }])).toBe('tree');
    });

    it('should detect array from tags', () => {
      expect(detectVisualizationType([{ name: 'Array' }])).toBe('array');
      expect(detectVisualizationType([{ name: 'Stack' }])).toBe('array');
      expect(detectVisualizationType([{ name: 'Queue' }])).toBe('array');
      expect(detectVisualizationType([{ name: 'Hash Table' }])).toBe('array');
    });

    it('should detect matrix from tags', () => {
      expect(detectVisualizationType([{ name: 'Matrix' }])).toBe('matrix');
    });

    it('should detect graph from tags', () => {
      expect(detectVisualizationType([{ name: 'Graph' }])).toBe('graph');
    });

    it('should detect string from tags', () => {
      expect(detectVisualizationType([{ name: 'String' }])).toBe('string');
    });

    it('should return null for algorithm-only tags', () => {
      expect(detectVisualizationType([{ name: 'Dynamic Programming' }])).toBeNull();
      expect(detectVisualizationType([{ name: 'Two Pointers' }])).toBeNull();
      expect(detectVisualizationType([{ name: 'Binary Search' }])).toBeNull();
      expect(detectVisualizationType([{ name: 'Greedy' }])).toBeNull();
    });

    it('should pick first matching tag when multiple present', () => {
      expect(
        detectVisualizationType([
          { name: 'Dynamic Programming' },
          { name: 'Array' },
          { name: 'Hash Table' },
        ])
      ).toBe('array');
    });
  });

  describe('visualizeArray', () => {
    it('should render array with indices', () => {
      const result = visualizeArray([1, 2, 3]);
      expect(result).toContain('[0]');
      expect(result).toContain('[1]');
      expect(result).toContain('[2]');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should handle empty array', () => {
      expect(visualizeArray([])).toBe('');
    });
  });

  describe('visualizeLinkedList', () => {
    it('should render with arrows', () => {
      const result = visualizeLinkedList([1, 2, 3]);
      // Strip ANSI codes for testing
      const plain = result.replace(/\x1b\[[0-9;]*m/g, '');
      expect(plain).toContain('1');
      expect(plain).toContain('→');
      expect(plain).toContain('2');
      expect(plain).toContain('3');
    });

    it('should handle empty list', () => {
      const result = visualizeLinkedList([]);
      expect(result).toContain('empty');
    });
  });

  describe('visualizeTestOutput', () => {
    it('should mark unsupported for non-visualizable tags', () => {
      const result = visualizeTestOutput('[1,2,3]', '[1,2,3]', [{ name: 'Backtracking' }]);
      expect(result.unsupported).toBe(true);
    });

    it('should visualize array output', () => {
      const result = visualizeTestOutput('[1,2,3]', '[1,2,3]', [{ name: 'Array' }]);
      expect(result.unsupported).toBeUndefined();
      expect(result.matches).toBe(true);
    });

    it('should detect mismatch', () => {
      const result = visualizeTestOutput('[1,2,3]', '[1,2,4]', [{ name: 'Array' }]);
      expect(result.matches).toBe(false);
    });

    it('should auto-detect matrix without tag', () => {
      const result = visualizeTestOutput('[[1,2],[3,4]]', '[[1,2],[3,4]]', [
        { name: 'Dynamic Programming' },
      ]);
      // Should render as matrix even though tag is DP
      expect(result.outputVis).toContain('│');
      expect(result.unsupported).toBeUndefined();
    });
  });
});
