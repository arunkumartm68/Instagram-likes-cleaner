const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '../extension');

function boot(saved) {
  const timers = new Map(); let id = 0;
  const controls = Object.fromEntries(['.status','.start','.stop','.close'].map(key => [key, {}]));
  const host = {style:{}, isConnected:true, attachShadow(){return {querySelector:key=>controls[key]};}, remove(){this.isConnected=false;}};
  const storage = new Map([['__igLikesCleanupExtension_v1',JSON.stringify(saved)]]);
  const context = {window:{}, location:{hostname:'www.instagram.com',pathname:'/your_activity/interactions/likes/'},
    document:{createElement:()=>host,documentElement:{appendChild(){}},body:{innerText:''}},
    sessionStorage:{getItem:key=>storage.get(key),removeItem:key=>storage.delete(key),setItem:(key,value)=>storage.set(key,value)},
    setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(fs.readFileSync(path.join(root,'cleanup.js'),'utf8'),context);
  return {timers,controls,host,storage};
}
test('Stop cancels automatic restart before any page interaction',()=>{
  const app=boot({active:true,total:100,batches:1});
  assert.equal(app.timers.size,1);
  app.controls['.stop'].onclick();
  assert.equal(app.timers.size,0);
  assert.equal(app.storage.size,0);
});
test('Close cancels queued restart and removes idle panel',()=>{
  const app=boot({active:true});
  app.controls['.close'].onclick();
  assert.equal(app.timers.size,0);
  assert.equal(app.host.isConnected,false);
});
test('null state does not crash startup or start a cleanup',()=>{
  assert.equal(boot(null).timers.size,0);
});
test('manifest limits injection and requests no extra permissions',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
  assert.deepEqual(manifest.content_scripts[0].matches,['https://www.instagram.com/your_activity/interactions/likes/*']);
  assert.equal(manifest.permissions,undefined);
  assert.equal(manifest.host_permissions,undefined);
  assert.ok(!manifest.content_scripts[0].world || manifest.content_scripts[0].world==='ISOLATED');
  for(const file of manifest.content_scripts[0].js) assert.ok(fs.existsSync(path.join(root,file)));
});
test('dragging clamps panel and saves only its position',()=>{
  const events={}; let stored;
  const host={style:{},getBoundingClientRect(){return {left:parseFloat(this.style.left)||400,top:parseFloat(this.style.top)||100,width:310,height:350};}};
  const heading={style:{cssText:''},setPointerCapture(){},addEventListener:(name,fn)=>events[name]=fn};
  host.shadowRoot={querySelector:()=>heading};
  vm.runInNewContext(fs.readFileSync(path.join(root,'drag.js'),'utf8'),{
    document:{documentElement:{children:[host]}},innerWidth:800,innerHeight:700,
    localStorage:{getItem:()=>null,setItem:(key,value)=>stored=JSON.parse(value)},window:{addEventListener(){}}
  });
  events.pointerdown({button:0,pointerId:1,clientX:410,clientY:110,preventDefault(){}});
  events.pointermove({pointerId:1,clientX:2000,clientY:2000});
  assert.equal(host.style.left,'490px'); assert.equal(host.style.top,'350px');
  events.pointerup({pointerId:1});
  assert.deepEqual(stored,{left:490,top:350});
});
