import { describe, expect, test } from '@jest/globals';
import { createEmojisHandler } from '../../../src/cli/commands/emojis.mjs';

describe('emoji command handler', () => {
  const e = { list:()=> 'list', get:id=>['get',id], create:x=>['create',x], update:(id,x)=>['update',id,x], delete:id=>['delete',id] }; const api={guilds:{get:()=>({emojis:e})}};
  test.each([['list',{},'list'],['get',{emoji:'e'},['get','e']],['create',{name:'n',file:'f'},['create',{name:'n',attachment:'f'}]],['update',{emoji:'e',name:'n'},['update','e',{name:'n'}]],['delete',{emoji:'e'},['delete','e']]])('%s',(op,o,v)=>expect(createEmojisHandler({command:['emojis',op],options:{guild:'g',...o},api})).toEqual({handled:true,value:v}));
  test('requires fields',()=>expect(()=>createEmojisHandler({command:['emojis','create'],options:{guild:'g'},api})).toThrow());
  test('ignores other commands',()=>expect(createEmojisHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
