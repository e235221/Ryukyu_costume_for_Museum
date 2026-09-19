import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {FaceSlots,faceGeometry} from './face-slots.mjs';
class Element {
  constructor(dataset={}) {this.dataset=dataset;this.attributes={};this.events={};}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.events[k]=fn;}
  click(){this.events.click();}
  getContext(){return {};}
}
const nodes=new Map();
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
const people=[0,1,2].map(i=>new Element({person:String(i)}));
const outfits=['man','woman','none'].map(costume=>new Element({costume}));
const document={getElementById:get,querySelectorAll:s=>s==='[data-person]'?people:outfits,addEventListener(){}};
const source=fs.readFileSync(new URL('./multiface.mjs',import.meta.url),'utf8').replace(/^import .*;\n/,'');
vm.runInNewContext(source,{document,window:{addEventListener(){}},FaceSlots,faceGeometry,console});
people[0].click();outfits[1].click();
people[1].click();outfits[0].click();
people[2].click();outfits[2].click();
for(const [person,choice] of [[0,1],[1,0],[2,2]]){
  people[person].click();
  assert.equal(outfits[choice].attributes['aria-pressed'],'true');
  assert.equal(outfits.filter(b=>b.attributes['aria-pressed']==='true').length,1);
  assert.equal(get('assignmentLabel').textContent,`人物${person+1} の衣装`);
}
get('resetPeople').click();people[0].click();assert.equal(outfits[1].attributes['aria-pressed'],'true');
console.log('PASS: per-person independent clothing, none, selected label, reset preserves assignments (DOM mocked).');
