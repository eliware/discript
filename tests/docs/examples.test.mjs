import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../../src/evaluator.mjs';
import { parse } from '../../src/parser/index.mjs';
import { createEnvironment } from '../../src/env.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const examples = join(root, 'examples');

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(file) : entry.name.endsWith('.ds') ? [file] : [];
  }))).flat();
}

describe('executable documentation', () => {
  test('every example parses', async () => {
    const files = await filesUnder(examples);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      expect(() => parse(source)).not.toThrow();
    }
  });

  test('fundamental examples execute with the documented host functions', async () => {
    const output = [];
    const values = {};
    const globals = {
      env: createEnvironment(values),
      print: value => { output.push(value); return value; },
      sleep: async delay => { await new Promise(resolveDelay => setTimeout(resolveDelay, Number(delay))); return undefined; },
      parallel: (...operations) => Promise.all(operations),
      map: async (items, callback) => Promise.all(items.map(item => callback(item))),
      filter: async (items, callback) => (await Promise.all(items.map(async item => [item, await callback(item)]))).filter(([, keep]) => keep).map(([item]) => item),
      reduce: async (items, callback, initial) => { let value = initial; for (const item of items) value = await callback(value, item); return value; },
    };
    const names = ['hello', 'values', 'functions', 'conditionals', 'loops', 'while', 'callbacks', 'parallel', 'exit-codes'];
    for (const name of names) {
      const file = join(examples, 'fundamentals', `${name}.ds`);
      await expect(evaluate(parse(await readFile(file, 'utf8')), globals, { baseDir: dirname(file) })).resolves.toBeDefined();
    }
    expect(output.length).toBeGreaterThan(0);
  });
});
