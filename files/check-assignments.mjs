import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {FaceSlots,faceGeometry} from './face-slots.mjs';
const draws=[];
const rotations=[];
const canvasContext={clearRect(){},save(){},restore(){},translate(){},rotate(a){rotations.push(a);},drawImage(...args){draws.push(args);}};
class Element {
  constructor(dataset={}) {this.dataset=dataset;this.attributes={};this.events={};}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}
  click(){this.events.click();}
  getContext(){return canvasContext;}
}
const nodes=new Map();
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
const people=[0,1,2].map(i=>new Element({person:String(i)}));
const outfits=['man','woman','none','bird'].map(costume=>new Element({costume}));
const document={getElementById:get,querySelectorAll:s=>s==='[data-person]'?people:outfits,addEventListener(){}};
const source=fs.readFileSync(new URL('./multiface.mjs',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const runtime=vm.createContext({document,window:{addEventListener(){}},FaceSlots,faceGeometry,console,performance:{now:()=>6000}});
vm.runInContext(source,runtime);
people[0].click();outfits[1].click();
people[1].click();outfits[0].click();
people[2].click();outfits[2].click();
for(const [person,choice] of [[0,1],[1,0],[2,2]]){
  people[person].click();
  assert.equal(outfits[choice].attributes['aria-pressed'],'true');
  assert.equal(outfits.filter(b=>b.attributes['aria-pressed']==='true').length,1);
  assert.equal(get('assignmentLabel').textContent,`人物${person+1} の衣装・顔`);
}
get('resetPeople').click();people[0].click();assert.equal(outfits[1].attributes['aria-pressed'],'true');
outfits[3].click();assert.equal(outfits[3].attributes['aria-pressed'],'true');
people[1].click();assert.equal(outfits[0].attributes['aria-pressed'],'true');
people[0].click();assert.equal(outfits[3].attributes['aria-pressed'],'true');
outfits[2].click();assert.equal(outfits[3].attributes['aria-pressed'],'false');
// Exercise the real drawing branch with a tilted, detected face.
get('ar-container').clientWidth=1280;get('ar-container').clientHeight=720;
vm.runInContext(`
  video={videoWidth:1280,videoHeight:720};
  outfits[0]='bird';
  slots.update([{x:.5,y:.5,size:.1,left:{x:.45,y:.5},right:{x:.55,y:.5},top:{x:.5,y:.4},bottom:{x:.5,y:.6},eyes:[{x:.47,y:.46},{x:.53,y:.48}]}],0);
  draw();
`,runtime);
assert.equal(draws.length,1);
assert.equal(draws[0][0],get('img-bird'));
assert(rotations[0]>0);
const [image,x,y,width,height]=draws[0];
assert(width>0&&width===height);
assert(Math.abs(x+626*width/1254)<1e-8);
assert(Math.abs(y+623.5*height/1254)<1e-8);
assert(width*1136/1254>=128*1.35-1e-8);
assert(height*1049/1254>=144*1.25-1e-8);
draws.length=0;outfits[2].click();assert.equal(draws.length,0);
console.log('PASS: bird image rendered with face coverage, center alignment and tilt; none removes it (Canvas mocked).');
console.log('PASS: per-person independent clothing, none, selected label, reset preserves assignments (DOM mocked).');
