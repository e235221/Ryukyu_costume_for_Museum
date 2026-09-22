const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
(async () => {
  let resultCallback, interval, sends = 0, operations = [];
  const ctx = {save(){},restore(){},clearRect(){},translate(){},scale(){},drawImage(image){operations.push(image);}};
  const canvas = {hidden: true, parentElement:{clientWidth:1200,clientHeight:800},getContext:()=>ctx};
  const status = {}, summary = {attributes:{},setAttribute(key,value){this.attributes[key]=value;}}, choice = {};
  const buttons = ['none','beach','stone','castle-before','castle-after'].map(name=>({dataset:{background:name},setAttribute(){},addEventListener(_,fn){this.click=fn;}}));
  const api = {window:{},console, Image:class {async decode(){}},
    setTimeout:()=>1,clearTimeout(){},setInterval(fn){interval=fn;return 1;},clearInterval(){interval=null;},
    document:{hidden:false,getElementById:id=>({backgroundCanvas:canvas,backgroundStatus:status,backgroundSummary:summary,backgroundChoice:choice})[id],querySelectorAll:()=>buttons,createElement:()=>({}),head:{appendChild(script){script.onload();}}},
    SelfieSegmentation:class {setOptions(){} onResults(fn){resultCallback=fn;} async send(){sends++; resultCallback({segmentationMask:{width:640,height:480},image:{width:640,height:480}});}}
  };
  vm.runInNewContext(fs.readFileSync(__dirname+'/../assets/js/background.js','utf8'),api);
  const tick = async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();};
  api.window.costumeBackground.start({readyState:4});
  assert.equal(interval,undefined);
  await buttons[1].click(); await tick();
  assert.equal(choice.textContent,'：海'); assert.equal(summary.attributes['aria-label'],'背景：海');
  await interval();
  assert.equal(canvas.hidden,false); assert.equal(canvas.width,960); assert.equal(canvas.height,640);
  assert(operations.at(-1).src==='assets/images/backgrounds/beach.jpg');
  await buttons[2].click(); await tick(); await interval();
  assert.equal(operations.at(-1).src,'assets/images/backgrounds/ishidatami.jpg');
  await buttons[3].click(); await tick(); await interval();
  assert.equal(operations.at(-1).src,'assets/images/backgrounds/shurijo-before.jpg');
  await buttons[4].click(); await tick(); await interval();
  assert.equal(operations.at(-1).src,'assets/images/backgrounds/shurijo-after.jpg');
  await buttons[0].click(); assert.equal(canvas.hidden,true); assert.equal(interval,null);
  assert.equal(choice.textContent,'：なし');
  api.window.appLanguage = {t(key, values) {
    if (key === 'none') return 'None';
    if (key === 'backgroundSummary') return `Background: ${values.background}`;
    if (key === 'backgroundChoice') return `: ${values.background}`;
    return key;
  }};
  api.window.costumeBackground.refreshLanguage();
  assert.equal(summary.attributes['aria-label'],'Background: None');
  assert.equal(choice.textContent,': None');
  delete api.window.appLanguage;
  await buttons[1].click();await tick();
  api.window.costumeBackground.stop();
  resultCallback({segmentationMask:{},image:{}});
  assert.equal(canvas.hidden,true); assert.equal(interval,null);
  const html = fs.readFileSync(__dirname+'/../index.html','utf8');
  assert.match(html,/<div class="dock-section tools-section">\s*<details class="background-picker">/);
  assert.match(html,/<summary id="backgroundSummary"[^>]*>[\s\S]*<span id="backgroundChoice">：なし<\/span><\/summary>/);
  assert.match(html,/なし[\s\S]*海[\s\S]*石畳[\s\S]*<\/div>[\s\S]*首里城（復元前）[\s\S]*首里城（復元後）/);
  assert.match(html,/<script src="assets\/js\/background\.js\?v=[^"]+"><\/script>/,'background script URL must change when its background map changes');
  console.log('PASS: five backgrounds, two-row collapsible picker, aspect ratio, none/stop cleanup, late-result rejection; model and canvas mocked.');
})().catch(error=>{console.error(error);process.exitCode=1;});
