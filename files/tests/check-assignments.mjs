import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {FaceSlots,faceGeometry} from '../assets/js/face-slots.mjs';
const draws=[];
const rotations=[];
const canvasContext={clearRect(){},save(){},restore(){},translate(){},rotate(a){rotations.push(a);},drawImage(...args){draws.push(args);}};
class Element {
  constructor(dataset={}) {this.dataset=dataset;this.attributes={};this.events={};this.disabled=false;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}
  click(){if(!this.disabled)this.events.click();}
  getContext(){return canvasContext;}
}
const nodes=new Map();
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
const people=[0,1,2].map(i=>new Element({person:String(i)}));
const outfits=['man','woman','none','bird'].map(costume=>new Element({costume}));
const document={getElementById:get,querySelectorAll:s=>s==='[data-person]'?people:outfits,addEventListener(){}};
const source=fs.readFileSync(new URL('../assets/js/multiface.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const runtime=vm.createContext({document,window:{addEventListener(){}},FaceSlots,faceGeometry,console,performance:{now:()=>6000}});
vm.runInContext(source,runtime);
assert(people.every(button=>button.disabled),'all person buttons start disabled before detection');
assert(outfits.every(button=>button.disabled),'clothing choices start disabled before detection');
assert.equal(get('assignmentLabel').textContent,'人物を検出すると衣装を選べます');
vm.runInContext(`
  slots.update([
    {x:.2,y:.4,size:.1},{x:.5,y:.4,size:.1},{x:.8,y:.4,size:.1}
  ],0);
  refresh();
`,runtime);
assert(people.every(button=>!button.disabled),'detected people become selectable');
assert(outfits.every(button=>!button.disabled),'clothing choices become available after detection');
people[0].click();outfits[1].click();
people[1].click();outfits[0].click();
people[2].click();outfits[2].click();
for(const [person,choice] of [[0,1],[1,0],[2,2]]){
  people[person].click();
  assert.equal(outfits[choice].attributes['aria-pressed'],'true');
  assert.equal(outfits.filter(b=>b.attributes['aria-pressed']==='true').length,1);
  assert.equal(get('assignmentLabel').textContent,`人物${person+1} の衣装・顔`);
}
get('resetPeople').click();
assert(people.every(button=>button.disabled),'reset makes all undetected people unavailable');
assert(outfits.every(button=>button.disabled),'reset disables clothing choices until detection resumes');
vm.runInContext(`slots.update([{x:.4,y:.4,size:.1}],100);refresh();`,runtime);
assert.equal(people[0].disabled,false);
assert.equal(people[1].disabled,true);
assert.equal(people[2].disabled,true);
assert.equal(people[1].attributes['aria-disabled'],'true');
people[1].click();
assert.equal(get('assignmentLabel').textContent,'人物1 の衣装・顔','disabled person cannot become selected');
people[0].click();assert.equal(outfits[1].attributes['aria-pressed'],'true');
outfits[3].click();assert.equal(outfits[3].attributes['aria-pressed'],'true');
vm.runInContext(`slots.update([{x:.4,y:.4,size:.1},{x:.7,y:.4,size:.1}],150);refresh();`,runtime);
assert.equal(people[1].disabled,false,'person 2 becomes selectable after detection');
people[1].click();assert.equal(outfits[0].attributes['aria-pressed'],'true');
people[0].click();assert.equal(outfits[3].attributes['aria-pressed'],'true');
outfits[2].click();assert.equal(outfits[3].attributes['aria-pressed'],'false');
vm.runInContext(`slots.update([],200);refresh();`,runtime);
assert(people.every(button=>button.disabled),'temporarily undetected people are disabled');
assert(outfits.every(button=>button.disabled),'clothing choices are disabled when nobody is detected');
assert.equal(get('assignmentLabel').textContent,'人物を検出すると衣装を選べます');
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
console.log('PASS: detected-only person selection, gray disabled state hooks, clothing lock, independent assignments (DOM mocked).');
