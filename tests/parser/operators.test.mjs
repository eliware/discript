import { describe, expect, test } from '@jest/globals';

describe('parser/operators', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/operators.mjs')).resolves.toBeDefined();
  });
});
