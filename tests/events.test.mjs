import { jest } from '@jest/globals';
import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('event declarations', () => {
  test('register a handler and bind each payload as event', async () => {
    const handlers = new Map();
    const on = jest.fn((name, handler) => { handlers.set(name, handler); return { event: name, registered: true }; });
    const print = jest.fn(value => value);
    const result = await evaluate(parse('on("messageCreate") { print(event.content) }'), { on, print });
    expect(result).toEqual({ event: 'messageCreate', registered: true });
    expect(on).toHaveBeenCalledWith('messageCreate', expect.any(Function));
    await handlers.get('messageCreate')({ content: 'hello' });
    expect(print).toHaveBeenCalledWith('hello');
  });

  test('rejects event declarations when registration is unavailable', async () => {
    await expect(evaluate(parse('on("ready") {}'))).rejects.toMatchObject({ code: 'RUNTIME_ERROR' });
  });
});
