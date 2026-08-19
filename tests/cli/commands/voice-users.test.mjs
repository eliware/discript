import { describe, expect, test } from '@jest/globals';
import { createVoiceUsersHandler } from '../../../src/cli/commands/voice-users.mjs';

describe('voice-user command handler', () => {
  const v={status:()=> 'status',move:(c,o)=>['move',c,o],mute:(x,o)=>['mute',x,o],deafen:(x,o)=>['deafen',x,o],disconnect:o=>['disconnect',o]}; const api={guilds:{get:()=>({members:{get:()=>({voice:v})}})}};
  const cases = [
    ['status', {}, 'status'], ['move', { channel: 'c' }, ['move', 'c', { reason: undefined }]],
    ['mute', {}, ['mute', true, { reason: undefined }]], ['unmute', {}, ['mute', false, { reason: undefined }]],
    ['deafen', {}, ['deafen', true, { reason: undefined }]], ['undeafen', {}, ['deafen', false, { reason: undefined }]],
    ['disconnect', {}, ['disconnect', { reason: undefined }]],
  ];
  test.each(cases)('%s', (op, o, val) => expect(createVoiceUsersHandler({ command: ['voice-users', op], options: { guild: 'g', user: 'u', ...o }, api })).toEqual({ handled: true, value: val }));
  test('requires target/channel',()=>{expect(()=>createVoiceUsersHandler({command:['voice-users','status'],options:{},api})).toThrow();expect(()=>createVoiceUsersHandler({command:['voice-users','move'],options:{guild:'g',user:'u'},api})).toThrow();});
  test('ignores other commands',()=>expect(createVoiceUsersHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
