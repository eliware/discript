import { describe, expect, test } from '@jest/globals';
import { createThreadsHandler } from '../../../src/cli/commands/threads.mjs';

describe('thread command handler', () => {
  const t={list:()=> 'list',create:n=>['create',n],update:(id,x)=>['update',id,x],delete:id=>['delete',id],archive:id=>['archive',id]}; const api={channels:{get:()=>({threads:t})}};
  test.each([['list',{},'list'],['create',{name:'n'},['create','n']],['update',{thread:'t',name:'n'},['update','t',{name:'n'}]],['delete',{thread:'t'},['delete','t']],['archive',{thread:'t'},['archive','t']]])('%s',(op,o,v)=>expect(createThreadsHandler({command:['threads',op],options:{channel:'c',...o},api})).toEqual({handled:true,value:v}));
  test('requires fields',()=>expect(()=>createThreadsHandler({command:['threads','create'],options:{channel:'c'},api})).toThrow());
  test('ignores other commands',()=>expect(createThreadsHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
