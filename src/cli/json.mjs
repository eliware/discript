export function createJsonHelpers() {
  return {
    stringify(value) {
      try { return JSON.stringify(value); }
      catch (error) { throw Object.assign(new Error(`Unable to serialize JSON: ${error.message}`), { code: 'JSON_SERIALIZE_ERROR', exitCode: 3, cause: error }); }
    },
    parse(value) {
      try { return JSON.parse(String(value)); }
      catch (error) { throw Object.assign(new Error(`Unable to parse JSON: ${error.message}`), { code: 'JSON_PARSE_ERROR', exitCode: 3, cause: error }); }
    },
  };
}
