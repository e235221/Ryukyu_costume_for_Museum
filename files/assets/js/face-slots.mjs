export class FaceSlots {
  constructor(count = 3) {this.count = count; this.reset();}
  reset() {this.slots = Array.from({length:this.count}, (_,id)=>({id, face:null, last:-Infinity, visible:false}));}
  update(faces, now) {
    for (const slot of this.slots) {slot.visible=false; if (now-slot.last>900) slot.face=null;}
    const active=this.slots.filter(s=>s.face);
    let best={cost:Infinity,pairs:[]};
    const visit=(index,used,pairs,cost)=>{
      if(index===active.length){if(cost<best.cost)best={cost,pairs:[...pairs]};return;}
      visit(index+1,used,pairs,cost+0.3);
      const old=active[index].face;
      faces.forEach((face,i)=>{
        if(used.has(i))return;
        const distance=Math.hypot(face.x-old.x,face.y-old.y);
        const ratio=face.size/old.size;
        if(distance>0.22||ratio<0.45||ratio>2.2)return;
        used.add(i);pairs.push([active[index],i]);
        visit(index+1,used,pairs,cost+distance+0.04*Math.abs(Math.log(ratio)));
        pairs.pop();used.delete(i);
      });
    };
    visit(0,new Set(),[],0);
    const used=new Set();
    const assign=(slot,i)=>{
      if (!slot.face) slot.detectedAt=now;
      slot.face=faces[i];slot.last=now;slot.visible=true;used.add(i);
    };
    best.pairs.forEach(([slot,i])=>assign(slot,i));
    faces.map((f,i)=>({f,i})).filter(x=>!used.has(x.i)).sort((a,b)=>a.f.x-b.f.x).forEach(({i})=>{
      const free=this.slots.find(s=>!s.face);if(free)assign(free,i);
    });
    return this.slots;
  }
}

export function faceGeometry(landmarks) {
  const p = i=>({x:1-landmarks[i].x,y:landmarks[i].y});
  const left=p(234),right=p(454),top=p(10),bottom=p(152);
  const eyes=[p(33),p(263)].sort((a,b)=>a.x-b.x);
  return {x:(top.x+bottom.x)/2,y:(top.y+bottom.y)/2,
    size:Math.hypot(left.x-right.x,left.y-right.y), left,right,top,bottom,eyes};
}
