import { describe, expect, test } from '@jest/globals';

describe('evaluator/control-flow', () => {
  test('module loads', async () => {
    await expect(import('../../src/evaluator/control-flow.mjs')).resolves.toBeDefined();
  });
});
