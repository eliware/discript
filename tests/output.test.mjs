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

  test('writes pretty JSON when json or pretty mode is selected', () => {
    const output = [];
    writeResult({ id: '1' }, { json: true }, value => output.push(value));
    writeResult({ id: '2' }, { pretty: true }, value => output.push(value));
    expect(output).toEqual(['{\n  "id": "1"\n}', '{\n  "id": "2"\n}']);
  });

  test('formats strings, arrays, and scalar values for human output', () => {
    const output = [];
    writeResult('hello', {}, value => output.push(value));
    writeResult([{ id: '1' }, { id: '2' }], {}, value => output.push(value));
    writeResult(null, {}, value => output.push(value));
    expect(output).toEqual(['hello', '{"id":"1"}', '{"id":"2"}', '']);
  });
});
