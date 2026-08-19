import { describe, expect, test } from '@jest/globals';
import { createInvitesHandler } from '../../../src/cli/commands/invites.mjs';

describe('invite command handler', () => {
  const inv={list:()=> 'list',create:(c,o)=>['create',c,o],delete:i=>['delete',i]}; const api={guilds:{get:()=>({invites:inv})}};
  test.each([['list',{guild:'g'},'list'],['create',{guild:'g',channel:'c',duration:'2',messages:'3'},['create','c',{maxAge:2,maxUses:3}]],['delete',{guild:'g',invite:'i'},['delete','i']]])('%s',(op,o,v)=>expect(createInvitesHandler({command:['invites',op],options:o,api})).toEqual({handled:true,value:v}));
  test('requires invite/channel',()=>{expect(()=>createInvitesHandler({command:['invites','delete'],options:{guild:'g'},api})).toThrow();expect(()=>createInvitesHandler({command:['invites','create'],options:{guild:'g'},api})).toThrow();});
  test('ignores other commands',()=>expect(createInvitesHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
