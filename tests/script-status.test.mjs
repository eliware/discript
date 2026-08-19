import { describe, expect, test } from '@jest/globals';
import { evaluate, ScriptExit } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('script status protocol', () => {
  test('supports explicit script exit codes', async () => {
    await expect(evaluate(parse('exit(10, "missing")'), {
      exit: (code, message) => { throw new ScriptExit(code, message); },
    })).rejects.toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 10, details: { message: 'missing' } });
  });
});
