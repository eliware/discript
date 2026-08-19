import { describe, expect, test } from '@jest/globals';

describe('evaluator/expressions', () => {
  test('module loads', async () => {
    await expect(import('../../src/evaluator/expressions.mjs')).resolves.toBeDefined();
  });
});
