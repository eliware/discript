import { describe, expect, test } from '@jest/globals';
import { createStickersHandler } from '../../../src/cli/commands/stickers.mjs';

describe('sticker command handler', () => {
  const s={list:()=> 'list',get:id=>['get',id],create:x=>['create',x],update:(id,x)=>['update',id,x],delete:id=>['delete',id]}; const api={guilds:{get:()=>({stickers:s})}};
  test.each([['list',{},'list'],['get',{sticker:'s'},['get','s']],['create',{name:'n',file:'f',tags:'t'},['create',{name:'n',file:'f',tags:'t',description:undefined}]],['update',{sticker:'s',name:'n'},['update','s',{name:'n',description:undefined,tags:undefined}]],['delete',{sticker:'s'},['delete','s']]])('%s',(op,o,v)=>expect(createStickersHandler({command:['stickers',op],options:{guild:'g',...o},api})).toEqual({handled:true,value:v}));
  test('requires fields',()=>expect(()=>createStickersHandler({command:['stickers','update'],options:{guild:'g',sticker:'s'},api})).toThrow());
  test('ignores other commands',()=>expect(createStickersHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
