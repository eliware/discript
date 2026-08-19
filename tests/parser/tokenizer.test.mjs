import { describe, expect, test } from '@jest/globals';

describe('parser/tokenizer', () => {
  test('module loads', async () => {
    await expect(import('../../src/parser/tokenizer.mjs')).resolves.toBeDefined();
  });
});
