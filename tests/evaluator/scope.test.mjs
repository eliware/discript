import { describe, expect, test } from '@jest/globals';

describe('evaluator/scope', () => {
  test('module loads', async () => {
    await expect(import('../../src/evaluator/scope.mjs')).resolves.toBeDefined();
  });
});
