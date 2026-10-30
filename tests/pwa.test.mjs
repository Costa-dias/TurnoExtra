import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {workerSource} from '../build/pwa.ts';
function harness({offline=false,failedInstall=false}={}) {
 const events={},deleted=[],added=[];let skipped=0,claimed=0;
 const cache={addAll:async urls=>{if(failedInstall)throw Error('network');added.push(...urls);},match:async p=>p==='/index.html'?new Response('offline app shell'):p==='/assets/app.js'?new Response('cached bundle'):undefined};
 const context={URL,Response,fetch:async()=>{if(offline)throw Error('offline');return new Response('online');},caches:{open:async()=>cache,keys:async()=>['turnoextra-static-old','workbox-precache-v2-https://app.test/','another-app','turnoextra-static-new'],delete:async k=>deleted.push(k)},self:{location:{origin:'https://app.test'},registration:{scope:'https://app.test/'},clients:{claim:async()=>claimed++},skipWaiting:async()=>skipped++,addEventListener:(name,fn)=>events[name]=fn}};
 vm.runInNewContext(workerSource('turnoextra-static-new',['/index.html','/assets/app.js']),context);
 return {events,deleted,added,get skipped(){return skipped;},get claimed(){return claimed;}};
}
test('precache completes before activation; a failed download keeps the previous worker',async()=>{
 const h=harness();let pending;h.events.install({waitUntil:p=>pending=p});await pending;assert.deepEqual(h.added,['/index.html','/assets/app.js']);assert.equal(h.skipped,1);
 const bad=harness({failedInstall:true});bad.events.install({waitUntil:p=>pending=p});await assert.rejects(pending);assert.equal(bad.skipped,0);
});
test('activation removes only its own static and scoped legacy caches',async()=>{
 const h=harness();let pending;h.events.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(h.deleted,['turnoextra-static-old','workbox-precache-v2-https://app.test/']);assert.equal(h.claimed,1);
});
test('offline navigation returns the shell; static requests use the cache',async()=>{
 const h=harness({offline:true});let response;
 h.events.fetch({request:{method:'GET',mode:'navigate',url:'https://app.test/?screen=month'},respondWith:p=>response=p});assert.equal(await(await response).text(),'offline app shell');
 h.events.fetch({request:{method:'GET',mode:'cors',url:'https://app.test/assets/app.js'},respondWith:p=>response=p});assert.equal(await(await response).text(),'cached bundle');
});
test('online navigation uses the server; external requests, POST and APIs are not cached',async()=>{
 const h=harness();let response;
 h.events.fetch({request:{method:'GET',mode:'navigate',url:'https://app.test/'},respondWith:p=>response=p});assert.equal(await(await response).text(),'online');
 for(const request of [{method:'POST',mode:'cors',url:'https://app.test/api'},{method:'GET',mode:'cors',url:'https://external.test/x'},{method:'GET',mode:'cors',url:'https://app.test/api/private'}])h.events.fetch({request,respondWith:()=>assert.fail('non-static data must not be intercepted')});
});
