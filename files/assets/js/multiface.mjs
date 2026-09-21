import {FaceSlots, faceGeometry} from './face-slots.mjs';
import {composePhoto, photoFilename} from './photo-capture.mjs';
import {AssignmentController} from './assignment-controller.mjs?v=20260921-1';
import {CostumeOverlay} from './costume-overlay.mjs?v=20260921-1';
import {visionModels} from './vision-models.mjs?v=20260921-1';

const FACE_INTERVAL_MS = 80;
const HAND_INTERVAL_MS = 160;
const $ = id => document.getElementById(id);
const container = $('ar-container');
const canvas = $('costumeCanvas');
const status = $('arStatus');
const loading = $('loadingOverlay');
const startButton = $('startBtn');
const photoButton = $('photoBtn');
const costumeImages = {man: $('img-man'), woman: $('img-woman'), bird: $('img-bird')};
const slots = new FaceSlots(3);

let video = null;
let stream = null;
let faceModel = null;
let handModel = null;
let handUnavailable = false;
let handPointers = [];
let epoch = 0;
let animationFrame = 0;
let lastVideoTime = -1;
let lastFaceFrame = 0;
let lastHandFrame = 0;
let overlay;

const assignments = new AssignmentController({
  slots,
  peopleButtons: [...document.querySelectorAll('[data-person]')],
  costumeButtons: [...document.querySelectorAll('[data-costume]')],
  detailButton: $('detailModeBtn'),
  detailHint: $('detailHint'),
  assignmentLabel: $('assignmentLabel'),
  resetButton: $('resetPeople'),
  onChange(reason) {
    const state = assignments.snapshot();
    if (reason === 'detail') {
      handPointers = [];
      if (state.detailMode && video) prepareHandTracking(epoch);
    }
    draw();
  }
});

overlay = new CostumeOverlay({
  canvas,
  container,
  images: costumeImages,
  descriptionOpen: () => Boolean(window.isCostumeDescriptionOpen?.()),
  onDetail(hit) {
    if (!window.showCostumeDetail?.(hit.costume, hit.region)) return;
    assignments.focus(hit.personId);
  }
});

if (window.ResizeObserver) {
  new window.ResizeObserver(([entry]) => {
    container.style.setProperty('--controls-height', `${entry.target.offsetHeight}px`);
  }).observe(document.querySelector('.costume-bar'));
}

function scene() {
  return {video, slots, handPointers, ...assignments.snapshot()};
}

function draw(now = performance.now()) {
  overlay.render(scene(), {now});
}

function prepareHandTracking(token) {
  if (handUnavailable) {
    assignments.setHandState('unavailable');
    return;
  }
  if (handModel) {
    assignments.setHandState('ready');
    return;
  }
  assignments.setHandState('loading');
  visionModels.hands().then(instance => {
    if (token !== epoch) return;
    handModel = instance;
    assignments.setHandState('ready');
  }).catch(error => {
    if (token !== epoch) return;
    handUnavailable = true;
    assignments.setHandState('unavailable');
    console.warn('Hand tracking is unavailable; touch interaction remains enabled.', error);
  });
}

canvas.addEventListener('pointerdown', event => {
  if (!assignments.snapshot().detailMode || window.isCostumeDescriptionOpen?.()) return;
  overlay.activateClientPoint(event.clientX, event.clientY);
});

let photoMessageTimer;
function photoMessage(message) {
  clearTimeout(photoMessageTimer);
  $('photoStatus').textContent = message;
  photoMessageTimer = setTimeout(() => {$('photoStatus').textContent = '';}, 4000);
}

function canvasBlob(target) {
  return new Promise((resolve, reject) => target.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('写真データを作成できません')),
    'image/png'
  ));
}

photoButton.addEventListener('click', async () => {
  if (!video || video.readyState < 2 || !faceModel) {
    photoMessage('カメラと顔認識の準備が完了してから撮影してください');
    return;
  }
  const selectedBackground = document.querySelector('[data-background][aria-pressed="true"]')?.dataset.background;
  const backgroundCanvas = $('backgroundCanvas');
  if (selectedBackground && selectedBackground !== 'none' && backgroundCanvas.hidden) {
    photoMessage('背景の準備が完了してから撮影してください');
    return;
  }
  photoButton.disabled = true;
  try {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const cleanCostumes = document.createElement('canvas');
    overlay.render(scene(), {targetCanvas: cleanCostumes, includeLabels: false, includePointers: false});
    const output = document.createElement('canvas');
    composePhoto(output, {
      video,
      backgroundCanvas: backgroundCanvas.hidden ? null : backgroundCanvas,
      costumeCanvas: cleanCostumes,
      width,
      height
    });
    const blob = await canvasBlob(output);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = photoFilename();
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    photoMessage('写真を保存しました');
  } catch (error) {
    console.error('Photo capture:', error);
    photoMessage(`写真を保存できません：${error.message}`);
  } finally {
    photoButton.disabled = !(video && faceModel);
  }
});

function stop() {
  epoch += 1;
  cancelAnimationFrame(animationFrame);
  window.costumeBackground?.stop();
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  if (video) {
    video.pause();
    video.srcObject = null;
    video.remove();
    video = null;
  }
  handPointers = [];
  slots.reset();
  assignments.stopDetailMode();
  overlay.reset();
  startButton.disabled = false;
  photoButton.disabled = true;
}

function fail(error) {
  stop();
  loading.classList.add('hidden');
  status.textContent = `起動できません：${error.message}。左上の矢印で戻って再試行してください。`;
  console.error(error);
}

function detectHands(now, token) {
  if (!assignments.snapshot().detailMode || !handModel || now - lastHandFrame < HAND_INTERVAL_MS) return;
  lastHandFrame = now;
  try {
    const result = handModel.detectForVideo(video, now);
    handPointers = result.landmarks.map(hand => ({x: 1 - hand[8].x, y: hand[8].y}));
  } catch (error) {
    if (token !== epoch) return;
    handModel = null;
    handUnavailable = true;
    handPointers = [];
    assignments.setHandState('unavailable');
    console.warn('Hand tracking stopped; touch interaction remains enabled.', error);
  }
}

function frame(now, token) {
  if (token !== epoch || !video) return;
  try {
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastFaceFrame >= FACE_INTERVAL_MS) {
      lastVideoTime = video.currentTime;
      lastFaceFrame = now;
      const result = faceModel.detectForVideo(video, now);
      const tracks = slots.update(result.faceLandmarks.map(faceGeometry), now);
      detectHands(now, token);
      assignments.refresh();
      draw(now);
      const count = tracks.filter(slot => slot.visible).length;
      status.textContent = count ? `${count}人を認識中（最大3人）` : '顔をカメラに向けてください';
    }
    animationFrame = requestAnimationFrame(time => frame(time, token));
  } catch (error) {
    fail(error);
  }
}

startButton.addEventListener('click', async () => {
  if (startButton.disabled) return;
  startButton.disabled = true;
  const token = ++epoch;
  $('landing').style.display = 'none';
  container.classList.add('active');
  loading.classList.remove('hidden');
  status.textContent = '';
  const timeout = setTimeout(() => {
    if (token === epoch) fail(new Error('準備がタイムアウトしました'));
  }, 60000);

  try {
    if (location.protocol === 'file:') throw new Error('ARを起動.commandからlocalhostで開いてください');
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('localhostまたはHTTPSが必要です');
    await Promise.all(Object.values(costumeImages).map(image => image.decode()));
    if (token !== epoch) return;
    const acquired = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {facingMode: 'user', width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 24, max: 30}}
    });
    if (token !== epoch) {
      acquired.getTracks().forEach(track => track.stop());
      return;
    }
    stream = acquired;
    video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)';
    container.appendChild(video);
    video.srcObject = stream;
    await video.play();
    if (token !== epoch) return;
    loading.classList.add('hidden');
    status.textContent = '複数人の顔認識を準備中...';
    faceModel = await visionModels.face();
    if (token !== epoch) return;
    photoButton.disabled = false;
    window.costumeBackground?.start(video);
    lastVideoTime = -1;
    lastFaceFrame = 0;
    lastHandFrame = 0;
    slots.reset();
    frame(performance.now(), token);
  } catch (error) {
    if (token === epoch) fail(error);
  } finally {
    clearTimeout(timeout);
  }
});

$('backBtn').addEventListener('click', () => {
  stop();
  container.classList.remove('active');
  $('landing').style.display = '';
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && startButton.disabled) $('backBtn').click();
});
window.addEventListener('pagehide', stop);
window.addEventListener('resize', () => draw());
$('infoBtn').addEventListener('click', () => {
  const state = assignments.snapshot();
  const kind = state.outfits[state.selectedPerson];
  window.showCostumeDescription?.(kind === 'none' ? 'man' : kind);
});
