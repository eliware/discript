import { describe, expect, test } from '@jest/globals';
import { createEventsHandler } from '../../../src/cli/commands/events.mjs';

describe('scheduled event command handler', () => {
  const e={list:()=> 'list',create:x=>['create',x],get:id=>({delete:()=>['delete',id],update:x=>['update',id,x]})}; const api={guilds:{get:()=>({scheduledEvents:e})}};
  test.each([['list',{},'list'],['create',{name:'n',start:'s'},['create',{name:'n',scheduledStartTime:'s',description:undefined,entityType:3,entityMetadata:undefined}]],['delete',{event:'e'},['delete','e']],['update',{event:'e',name:'n'},['update','e',{name:'n'}]]])('%s',(op,o,v)=>expect(createEventsHandler({command:['events',op],options:{guild:'g',...o},api})).toEqual({handled:true,value:v}));
  test('forwards event type, location, description, and start options', () => expect(createEventsHandler({ command: ['events', 'create'], options: { guild: 'g', name: 'n', start: 's', description: 'd', event_type: '2', location: 'room' }, api })).toEqual({ handled: true, value: ['create', { name: 'n', scheduledStartTime: 's', description: 'd', entityType: 2, entityMetadata: { location: 'room' } }] }));
  test('updates every supported event field', () => expect(createEventsHandler({ command: ['events', 'update'], options: { guild: 'g', event: 'e', name: 'n', description: 'd', start: 's' }, api })).toEqual({ handled: true, value: ['update', 'e', { name: 'n', description: 'd', scheduledStartTime: 's' }] }));
  test.each([
    [{ description: 'd' }, { description: 'd' }],
    [{ start: 's' }, { scheduledStartTime: 's' }],
  ])('updates a single non-name field', (fields, expected) => expect(createEventsHandler({ command: ['events', 'update'], options: { guild: 'g', event: 'e', ...fields }, api })).toEqual({ handled: true, value: ['update', 'e', expected] }));
  test('requires fields',()=>expect(()=>createEventsHandler({command:['events','update'],options:{guild:'g',event:'e'},api})).toThrow());
  test('ignores other commands',()=>expect(createEventsHandler({command:['guilds','list'],options:{},api:{}})).toEqual({handled:false}));
});
