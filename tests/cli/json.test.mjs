import { createJsonHelpers } from '../../src/cli/json.mjs';

describe('script JSON helpers', () => {
  test('round trips JSON values', () => {
    const json = createJsonHelpers();
    expect(json.parse(json.stringify({ answer: 42 }))).toEqual({ answer: 42 });
  });

  test('reports stable parse and serialization errors', () => {
    const json = createJsonHelpers();
    expect(() => json.parse('{')).toThrow(expect.objectContaining({ code: 'JSON_PARSE_ERROR', exitCode: 3 }));
    const circular = {};
    circular.self = circular;
    expect(() => json.stringify(circular)).toThrow(expect.objectContaining({ code: 'JSON_SERIALIZE_ERROR', exitCode: 3 }));
  });
});
