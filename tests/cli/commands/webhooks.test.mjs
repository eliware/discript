import { describe, expect, test } from '@jest/globals';
import { createWebhooksHandler } from '../../../src/cli/commands/webhooks.mjs';

describe('webhook command handler', () => {
  const w={list:()=> 'list',create:(n,o)=>['create',n,o],update:(id,x,o)=>['update',id,x,o],delete:(id,o)=>['delete',id,o]}; const api={channels:{get:()=>({webhooks:w})}};
  test.each([['list',{},'list'],['create',{name:'n',reason:'r'},['create','n',{reason:'r'}]],['update',{webhook:'w',name:'n',reason:'r'},['update','w',{name:'n'},{reason:'r'}]],['delete',{webhook:'w',reason:'r'},['delete','w',{reason:'r'}]]])('%s',(op,o,v)=>expect(createWebhooksHandler({command:['webhooks',op],options:{channel:'c',...o},api})).toEqual({handled:true,value:v}));
  test('requires fields',()=>expect(()=>createWebhooksHandler({command:['webhooks','create'],options:{channel:'c'},api})).toThrow());
  test('ignores other commands',()=>expect(createWebhooksHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
