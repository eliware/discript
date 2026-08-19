import { describe, expect, test } from '@jest/globals';

describe('evaluator/functions', () => {
  test('module loads', async () => {
    await expect(import('../../src/evaluator/functions.mjs')).resolves.toBeDefined();
  });
});
