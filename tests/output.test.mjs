import { writeResult } from '../src/output.mjs';

describe('output formats', () => {
  test('writes one JSON value per line in jsonl mode', () => {
    const output = [];
    writeResult({ id: '1', ok: true }, { output: 'jsonl' }, value => output.push(value));
    writeResult([1, 2], { output: 'jsonl' }, value => output.push(value));
    expect(output).toEqual(['{"id":"1","ok":true}', '[1,2]']);
  });

  test('writes null for an undefined result in jsonl mode', () => {
    const output = [];
    writeResult(undefined, { output: 'jsonl' }, value => output.push(value));
    expect(output).toEqual(['null']);
  });
});
