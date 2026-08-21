import { describe, expect, test } from '@jest/globals';

describe('input', () => {
  test('module loads', async () => {
    await expect(import('../src/input.mjs')).resolves.toBeDefined();
  });

  test('treats a script path followed by values as script arguments', async () => {
    const { readSource } = await import('../src/input.mjs');
    const source = await readSource(['examples/fundamentals/hello.ds', 'guild-1', 'preview'], {}, { isTTY: true });
    expect(source).toMatchObject({ kind: 'source', origin: 'examples/fundamentals/hello.ds', args: ['guild-1', 'preview'] });
  });

  test('passes trailing values to evaluated source', async () => {
    const { readSource } = await import('../src/input.mjs');
    await expect(readSource([], { eval: 'args[0]' }, { isTTY: true })).resolves.toMatchObject({ args: [] });
  });
});
