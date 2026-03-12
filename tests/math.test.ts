import { describe, it, expect } from 'vitest';
import { sum } from '../src/math';

describe('math', () => {
  describe('sum', () => {
    it('should return the sum of two positive numbers', () => {
      expect(sum(1, 2)).toBe(3);
    });

    it('should return the sum of two negative numbers', () => {
      expect(sum(-1, -2)).toBe(-3);
    });

    it('should return the sum of positive and negative numbers', () => {
      expect(sum(5, -3)).toBe(2);
    });

    it('should return zero when both inputs are zero', () => {
      expect(sum(0, 0)).toBe(0);
    });
  });
});
