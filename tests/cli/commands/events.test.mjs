import { describe, expect, test } from '@jest/globals';
import { createEventsHandler } from '../../../src/cli/commands/events.mjs';

describe('scheduled event command handler', () => {
  const e={list:()=> 'list',create:x=>['create',x],get:id=>({delete:()=>['delete',id],update:x=>['update',id,x]})}; const api={guilds:{get:()=>({scheduledEvents:e})}};
  test.each([['list',{},'list'],['create',{name:'n',start:'s'},['create',{name:'n',scheduledStartTime:'s',description:undefined,entityType:3,entityMetadata:undefined}]],['delete',{event:'e'},['delete','e']],['update',{event:'e',name:'n'},['update','e',{name:'n'}]]])('%s',(op,o,v)=>expect(createEventsHandler({command:['events',op],options:{guild:'g',...o},api})).toEqual({handled:true,value:v}));
  test('requires fields',()=>expect(()=>createEventsHandler({command:['events','update'],options:{guild:'g',event:'e'},api})).toThrow());
  test('ignores other commands',()=>expect(createEventsHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
