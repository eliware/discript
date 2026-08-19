import { writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('script imports', () => {
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

  test('rejects imports without a loader', async () => {
    await expect(evaluate(parse('import "shared.ds"'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });
});
