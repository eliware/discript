import { describe, expect, test } from '@jest/globals';
import { createVoiceHandler } from '../../../src/cli/commands/voice.mjs';

describe('voice command handler', () => {
  const api={voice:{join:c=>['join',c],status:g=>['status',g],leave:g=>['leave',g]}};
  test.each([['join',{channel:'c'},['join','c']],['status',{guild:'g'},['status','g']],['leave',{guild:'g'},['leave','g']]])('%s',(op,o,v)=>expect(createVoiceHandler({command:['voice',op],options:o,api})).toEqual({handled:true,value:v}));
  test('requires target',()=>expect(()=>createVoiceHandler({command:['voice','join'],options:{},api})).toThrow());
  test('ignores other commands',()=>expect(createVoiceHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
