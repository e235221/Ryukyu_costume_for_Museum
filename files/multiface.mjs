import {FaceSlots, faceGeometry} from './face-slots.mjs';
import {composePhoto, photoFilename} from './photo-capture.mjs';
const $=id=>document.getElementById(id);
const container=$('ar-container'),canvas=$('costumeCanvas'),ctx=canvas.getContext('2d');
const status=$('arStatus'),loading=$('loadingOverlay'),start=$('startBtn');
const slots=new FaceSlots(3), outfits=['man','woman','man'];
const images={man:$('img-man'),woman:$('img-woman'),bird:$('img-bird')};
let selected=0,video=null,stream=null,model=null,modelPromise,epoch=0,raf=0,lastTime=-1,lastFrame=0;
const people=[...document.querySelectorAll('[data-person]')];
const clothing=[...document.querySelectorAll('[data-costume]')];
// Keep the bottom-right status above the controls, including when they wrap.
if (window.ResizeObserver) {
  new ResizeObserver(([entry]) => {
    container.style.setProperty('--controls-height', `${entry.target.offsetHeight}px`);
  }).observe(document.querySelector('.costume-bar'));
}
function refresh() {
  const firstVisible=slots.slots.findIndex(slot=>slot.visible);
  if(!slots.slots[selected].visible&&firstVisible>=0)selected=firstVisible;
  const hasSelectedPerson=firstVisible>=0&&slots.slots[selected].visible;
  people.forEach((b,i)=>{
    const visible=slots.slots[i].visible;
    b.disabled=!visible;
    b.setAttribute('aria-disabled',String(!visible));
    b.setAttribute('aria-pressed',String(visible&&i===selected));
    b.textContent=`人物${i+1}${visible?' ✓':'（未検出）'}`;
  });
  clothing.forEach(b=>{
    b.disabled=!hasSelectedPerson;
    b.setAttribute('aria-disabled',String(!hasSelectedPerson));
    b.setAttribute('aria-pressed',String(b.dataset.costume===outfits[selected]));
  });
  $('assignmentLabel').textContent=hasSelectedPerson?`人物${selected+1} の衣装・顔`:'人物を検出すると衣装を選べます';
}
people.forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;selected=Number(b.dataset.person);refresh();}));
clothing.forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;outfits[selected]=b.dataset.costume;refresh();draw();}));
$('resetPeople').addEventListener('click',()=>{slots.reset();refresh();draw();});
function stop() {
  epoch++;cancelAnimationFrame(raf);window.costumeBackground?.stop();
  stream?.getTracks().forEach(t=>t.stop());stream=null;
  if(video){video.pause();video.srcObject=null;video.remove();video=null;}
  slots.reset();ctx.clearRect(0,0,canvas.width,canvas.height);refresh();start.disabled=false;$('photoBtn').disabled=true;
}
function fail(error) {stop();loading.classList.add('hidden');status.textContent=`起動できません：${error.message}。左上の矢印で戻って再試行してください。`;console.error(error);}
async function detector() {
  if(!modelPromise) modelPromise=(async()=>{
    const {FaceLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs');
    const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm');
    const options={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:3,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false};
    try {return await FaceLandmarker.createFromOptions(files,options);}
    catch {options.baseOptions.delegate='CPU';return await FaceLandmarker.createFromOptions(files,options);}
  })().catch(error=>{modelPromise=null;throw error;});
  return modelPromise;
}
function renderOverlay(targetCanvas=canvas,{clear=true,includeLabels=true}={}) {
  if(!video?.videoWidth)return;
  const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
  if(targetCanvas.width!==w||targetCanvas.height!==h){targetCanvas.width=w;targetCanvas.height=h;}
  const targetContext=targetCanvas.getContext('2d');
  if(clear)targetContext.clearRect(0,0,w,h);
  const scale=Math.max(w/video.videoWidth,h/video.videoHeight),vw=video.videoWidth*scale,vh=video.videoHeight*scale;
  const project=p=>({x:p.x*vw+(w-vw)/2,y:p.y*vh+(h-vh)/2});
  slots.slots.filter(s=>s.visible).sort((a,b)=>a.face.size-b.face.size).forEach(slot=>{
    const f=slot.face,c=project(f),top=project(f.top),bottom=project(f.bottom),left=project(f.left),right=project(f.right);
    const a=project(f.eyes[0]),b=project(f.eyes[1]),angle=Math.atan2(b.y-a.y,b.x-a.x);
    const kind=outfits[slot.id];
    if(kind==='bird') {
      // Fit the opaque head, not the transparent margins of the 1254px PNG.
      // Extra coverage prevents the human cheeks/forehead showing around it.
      const factor=Math.max(
        Math.hypot(left.x-right.x,left.y-right.y)*1.35/1136,
        Math.hypot(top.x-bottom.x,top.y-bottom.y)*1.25/1049
      );
      targetContext.save();targetContext.translate(c.x,c.y);targetContext.rotate(angle);
      targetContext.drawImage(images.bird,-626*factor,-623.5*factor,1254*factor,1254*factor);
      targetContext.restore();
    } else if(kind!=='none') {
      const hole=kind==='man'?{x:338.5,y:228.5,w:65,h:79}:{x:344,y:277,w:62,h:76};
      const factor=Math.max(Math.hypot(left.x-right.x,left.y-right.y)/hole.w,Math.hypot(top.x-bottom.x,top.y-bottom.y)/hole.h);
      targetContext.save();targetContext.translate(c.x,c.y);targetContext.rotate(angle);
      targetContext.drawImage(images[kind],-hole.x*factor,-hole.y*factor,683*factor,1024*factor);targetContext.restore();
    }
    const age = performance.now() - slot.detectedAt;
    if (includeLabels && age < 5000) {
      targetContext.save();
      targetContext.globalAlpha = Math.min(1, Math.max(0, (5000-age)/500));
      targetContext.fillStyle=slot.id===selected?'#8b1a1a':'#222';targetContext.fillRect(c.x-30,top.y-34,60,25);
      targetContext.font='bold 14px sans-serif';targetContext.textAlign='center';targetContext.fillStyle='white';targetContext.fillText(`人物${slot.id+1}`,c.x,top.y-16);
      targetContext.restore();
    }
  });
}
function draw(){renderOverlay();}

let photoMessageTimer;
function photoMessage(message) {
  clearTimeout(photoMessageTimer);
  $('photoStatus').textContent=message;
  photoMessageTimer=setTimeout(()=>$('photoStatus').textContent='',4000);
}
function canvasBlob(target) {
  return new Promise((resolve,reject)=>target.toBlob(blob=>blob?resolve(blob):reject(new Error('写真データを作成できません')),'image/png'));
}
$('photoBtn').addEventListener('click',async()=>{
  const button=$('photoBtn');
  if(!video||video.readyState<2||!model){photoMessage('カメラと顔認識の準備が完了してから撮影してください');return;}
  const selectedBackground=document.querySelector('[data-background][aria-pressed="true"]')?.dataset.background;
  const backgroundCanvas=$('backgroundCanvas');
  if(selectedBackground&&selectedBackground!=='none'&&backgroundCanvas.hidden){photoMessage('背景の準備が完了してから撮影してください');return;}
  button.disabled=true;
  try {
    const width=container.clientWidth,height=container.clientHeight;
    const cleanCostumes=document.createElement('canvas');
    renderOverlay(cleanCostumes,{includeLabels:false});
    const output=document.createElement('canvas');
    composePhoto(output,{video,backgroundCanvas:backgroundCanvas.hidden?null:backgroundCanvas,costumeCanvas:cleanCostumes,width,height});
    const blob=await canvasBlob(output);
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download=photoFilename();link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    photoMessage('写真を保存しました');
  } catch(error) {
    console.error('Photo capture:',error);
    photoMessage(`写真を保存できません：${error.message}`);
  } finally {button.disabled=!(video&&model);}
});
function frame(now,token) {
  if(token!==epoch||!video)return;
  try {
    if(video.readyState>=2&&video.currentTime!==lastTime&&now-lastFrame>=80){
      lastTime=video.currentTime;lastFrame=now;
      const result=model.detectForVideo(video,now);
      const tracks=slots.update(result.faceLandmarks.map(faceGeometry),now);refresh();draw();
      const count=tracks.filter(s=>s.visible).length;
      status.textContent=count?`${count}人を認識中（最大3人）`:'顔をカメラに向けてください';
    }
    raf=requestAnimationFrame(t=>frame(t,token));
  } catch(error){fail(error);}
}
start.addEventListener('click',async()=>{
  if(start.disabled)return;
  start.disabled=true;const token=++epoch;
  $('landing').style.display='none';container.classList.add('active');loading.classList.remove('hidden');status.textContent='';
  const timeout=setTimeout(()=>{if(token===epoch)fail(new Error('準備がタイムアウトしました'));},60000);
  try {
    if(location.protocol==='file:')throw new Error('ARを起動.commandからlocalhostで開いてください');
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('localhostまたはHTTPSが必要です');
    await Promise.all(Object.values(images).map(i=>i.decode()));
    if(token!==epoch)return;
    const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720},frameRate:{ideal:24,max:30}}});
    if(token!==epoch){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;video=document.createElement('video');video.muted=true;video.autoplay=true;video.playsInline=true;
    video.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)';container.appendChild(video);video.srcObject=stream;
    await video.play();if(token!==epoch)return;
    loading.classList.add('hidden');status.textContent='複数人の顔認識を準備中...';
    model=await detector();if(token!==epoch)return;$('photoBtn').disabled=false;
    window.costumeBackground?.start(video);lastTime=-1;lastFrame=0;slots.reset();frame(performance.now(),token);
  } catch(error){if(token===epoch)fail(error);}
  finally {clearTimeout(timeout);}
});
$('backBtn').addEventListener('click',()=>{stop();container.classList.remove('active');$('landing').style.display='';});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&start.disabled)$('backBtn').click();});
window.addEventListener('pagehide',stop);window.addEventListener('resize',draw);
$('infoBtn').addEventListener('click',()=>window.showCostumeDescription?.(outfits[selected]==='none'?'man':outfits[selected]));
refresh();
