import { evaluate } from '../src/evaluator.mjs';
import { parse } from '../src/parser.mjs';

describe('timers and async helpers', () => {
  test('registers recurring and one-shot timers', async () => {
    const timers = [];
    const result = await evaluate(parse('every(100) {}; after(250) {}'), {
      every: (delay, callback) => { timers.push(['every', delay, callback]); return { registered: true }; },
      after: (delay, callback) => { timers.push(['after', delay, callback]); return { registered: true }; },
    });
    expect(result).toEqual({ registered: true });
    expect(timers.map(timer => timer.slice(0, 2))).toEqual([['every', 100], ['after', 250]]);
  });

  test('supports sleep and parallel operations', async () => {
    const started = Date.now();
    const result = await evaluate(parse('parallel(sleep(5), sleep(5))'), {
      sleep: delay => new Promise(resolve => setTimeout(() => resolve(delay), delay)),
      parallel: (...operations) => Promise.all(operations),
    });
    expect(result).toEqual([5, 5]);
    expect(Date.now() - started).toBeLessThan(50);
  });
});
