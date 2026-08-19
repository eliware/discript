import { describe, expect, test } from '@jest/globals';

describe('evaluator/errors', () => {
  test('module loads', async () => {
    await expect(import('../../src/evaluator/errors.mjs')).resolves.toBeDefined();
  });
});
