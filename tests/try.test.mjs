import { describe, expect, test } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

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
