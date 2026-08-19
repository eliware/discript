import { describe, expect, jest, test } from '@jest/globals';

import { evaluate, ScriptExit } from '../../src/evaluator.mjs';

import { parse } from '../../src/parser.mjs';


describe('script status protocol', () => {
  test('supports explicit script exit codes', async () => {
    await expect(evaluate(parse('exit(10, "missing")'), {
      exit: (code, message) => { throw new ScriptExit(code, message); },
      })).rejects.toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 10, details: { message: 'missing' } });
  });

  test('does not turn explicit exit into a recoverable operation failure', async () => {
    await expect(evaluate(parse('try { exit(12, "stop") } catch (error) { print(error) }'), {
      exit: (code, message) => { throw new ScriptExit(code, message); },
      print: jest.fn(),
    })).rejects.toMatchObject({ code: 'SCRIPT_EXIT', exitCode: 12, details: { message: 'stop' } });
  });
});

describe('try expressions', () => {
  test('capture failures as normalized results', async () => {
    await expect(evaluate(parse('result = try { missing() } catch (error) { error }; result'))).resolves.toMatchObject({
      ok: false,
      exitCode: 1,
      error: { code: 'RUNTIME_ERROR' },
    });
  });

  test('return successful results', async () => {
    await expect(evaluate(parse('result = try { value } catch (error) { error }; result'), { value: 'ok' })).resolves.toEqual({ ok: true, exitCode: 0, value: 'ok' });
  });
});
