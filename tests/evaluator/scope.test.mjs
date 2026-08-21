import { describe, expect, test } from '@jest/globals';
import { writeFile, readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';

import { tmpdir } from 'node:os';

import { dirname, join, resolve } from 'node:path';

import { evaluate } from '../../src/evaluator.mjs';

import { parse } from '../../src/parser.mjs';
import { createScope } from '../../src/evaluator/scope.mjs';



describe('script imports', () => {
  test('creates a proxy over globals and binds functions to the active scope', () => {
    const globals = { value: 3 };
    const { baseScope, scope } = createScope(globals);
    expect(baseScope.get('value')).toBe(3);
    expect(scope.get('value')).toBe(3);
    expect(scope.size).toBe(1);
    scope.set('value', 4);
    expect(scope.get('value')).toBe(4);
  });

  test('uses a supplied shared scope', () => {
    const shared = new Map([['value', 9]]);
    const { baseScope, scope } = createScope({ value: 1 }, shared);
    expect(baseScope).toBe(shared);
    expect(scope.get('value')).toBe(9);
  });

  test('reads from an async execution context when one is active', () => {
    const { context, scope } = createScope({ value: 1 });
    expect(context.run(new Map([['value', 42]]), () => scope.get('value'))).toBe(42);
  });
  test('loads source into the caller scope', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-import-'));
    try {
      await writeFile(join(directory, 'shared.ds'), 'fn triple(value) { return value * 3 }');
      const result = await evaluate(parse('import "shared.ds"; triple(7)'), {}, {
        scope: new Map([
          ['importScript', async (path, scope) => evaluate(parse(await readFile(join(directory, path), 'utf8')), {}, { scope })],
        ]),
      });
      expect(result).toBe(21);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test('supports named exports and aliased imports', async () => {
    const shared = new Map();
    const load = async () => ({ triple: async value => value * 3 });
    shared.set('importScript', load);
    await expect(evaluate(parse('import tools from "tools.ds"; tools.triple(7)'), {}, { scope: shared })).resolves.toBe(21);

    const exports = {};
    const moduleScope = new Map([['exports', exports]]);
    await expect(evaluate(parse('export fn triple(value) { return value * 3 }'), {}, { scope: moduleScope })).resolves.toEqual(expect.any(Function));
    expect(exports.triple).toEqual(expect.any(Function));
  });

  test('rejects imports without a loader', async () => {
    await expect(evaluate(parse('import "shared.ds"'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });

  test('resolves nested imports relative to each importing file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'discript-nested-import-'));
    try {
      await mkdir(join(directory, 'nested'));
      await writeFile(join(directory, 'shared.ds'), 'fn triple(value) { return value * 3 }');
      await writeFile(join(directory, 'nested', 'entry.ds'), 'import "../shared.ds";');
      const load = async (path, scope, baseDir) => {
        const importedPath = resolve(baseDir, path);
        return evaluate(parse(await readFile(importedPath, 'utf8')), {}, { scope, baseDir: dirname(importedPath) });
      };
      await expect(evaluate(parse('import "nested/entry.ds"; triple(7)'), {}, { baseDir: directory, scope: new Map([['importScript', load]]) })).resolves.toBe(21);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
