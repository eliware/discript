import { describe, expect, test } from '@jest/globals';
import { createPermissionsHandler } from '../../../src/cli/commands/permissions.mjs';

describe('permission command handler', () => {
  const p={list:()=> 'list',set:(t,x,o)=>['set',t,x,o],delete:(t,o)=>['delete',t,o]}; const api={channels:{get:()=>({permissions:p})}};
  test.each([['list',{},'list'],['set',{target:'t',allow:'View,Send',deny:'Ban'},['set','t',{allow:['View','Send'],deny:['Ban']},{reason:undefined}]],['delete',{target:'t',reason:'r'},['delete','t',{reason:'r'}]]])('%s',(op,o,v)=>expect(createPermissionsHandler({command:['permissions',op],options:{channel:'c',...o},api})).toEqual({handled:true,value:v}));
  test('requires allow/deny',()=>expect(()=>createPermissionsHandler({command:['permissions','set'],options:{channel:'c',target:'t'},api})).toThrow());
  test('ignores other commands',()=>expect(createPermissionsHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
