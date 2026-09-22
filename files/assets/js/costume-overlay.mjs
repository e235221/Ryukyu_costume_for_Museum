import {CostumeDetailExplorer} from './costume-details.mjs?v=20260922-3';
import {t} from './language.mjs?v=20260922-2';

const COSTUME_HOLES = Object.freeze({
  man: {x: 338.5, y: 228.5, width: 65, height: 79},
  woman: {x: 344, y: 277, width: 62, height: 76}
});
const isRyuso = kind => kind === 'man' || kind === 'woman';

function createProjector(video, width, height) {
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const videoWidth = video.videoWidth * scale;
  const videoHeight = video.videoHeight * scale;
  return point => ({
    x: point.x * videoWidth + (width - videoWidth) / 2,
    y: point.y * videoHeight + (height - videoHeight) / 2
  });
}

function placementFor(slot, kind, project) {
  const face = slot.face;
  const center = project(face);
  const top = project(face.top);
  const bottom = project(face.bottom);
  const left = project(face.left);
  const right = project(face.right);
  const firstEye = project(face.eyes[0]);
  const secondEye = project(face.eyes[1]);
  const angle = Math.atan2(secondEye.y - firstEye.y, secondEye.x - firstEye.x);
  if (!isRyuso(kind)) return {personId: slot.id, kind, center, top, bottom, left, right, angle};
  const hole = COSTUME_HOLES[kind];
  const factor = Math.max(
    Math.hypot(left.x - right.x, left.y - right.y) / hole.width,
    Math.hypot(top.x - bottom.x, top.y - bottom.y) / hole.height
  );
  return {personId: slot.id, kind, center, top, bottom, left, right, angle, factor, hole};
}

function drawCostume(context, placement, images) {
  if (placement.kind === 'bird') {
    const factor = Math.max(
      Math.hypot(placement.left.x - placement.right.x, placement.left.y - placement.right.y) * 1.35 / 1136,
      Math.hypot(placement.top.x - placement.bottom.x, placement.top.y - placement.bottom.y) * 1.25 / 1049
    );
    context.save();
    context.translate(placement.center.x, placement.center.y);
    context.rotate(placement.angle);
    context.drawImage(images.bird, -626 * factor, -623.5 * factor, 1254 * factor, 1254 * factor);
    context.restore();
    return;
  }
  if (!isRyuso(placement.kind)) return;
  context.save();
  context.translate(placement.center.x, placement.center.y);
  context.rotate(placement.angle);
  context.drawImage(
    images[placement.kind],
    -placement.hole.x * placement.factor,
    -placement.hole.y * placement.factor,
    683 * placement.factor,
    1024 * placement.factor
  );
  context.restore();
}

function drawLabel(context, slot, placement, selectedPerson, now) {
  const age = now - slot.detectedAt;
  if (age >= 5000) return;
  context.save();
  context.globalAlpha = Math.min(1, Math.max(0, (5000 - age) / 500));
  context.fillStyle = slot.id === selectedPerson ? '#8b1a1a' : '#222';
  context.fillRect(placement.center.x - 30, placement.top.y - 34, 60, 25);
  context.font = 'bold 14px sans-serif';
  context.textAlign = 'center';
  context.fillStyle = 'white';
  context.fillText(t('person', {number: slot.id + 1}), placement.center.x, placement.top.y - 16);
  context.restore();
}

function drawPointer(context, state) {
  if (!state.point) return;
  const radius = 13;
  context.save();
  context.lineWidth = 4;
  context.strokeStyle = state.hit ? '#f0d77a' : 'rgba(255,255,255,0.85)';
  context.fillStyle = state.hit ? 'rgba(139,26,26,0.75)' : 'rgba(0,0,0,0.45)';
  context.beginPath();
  context.arc(state.point.x, state.point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  if (state.hit) {
    context.strokeStyle = '#fff';
    context.beginPath();
    context.arc(state.point.x, state.point.y, radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.progress);
    context.stroke();
    context.fillStyle = '#fff';
    context.font = 'bold 13px sans-serif';
    context.textAlign = 'center';
    context.fillText(state.hit.label, state.point.x, state.point.y - 23);
  }
  context.restore();
}

export class CostumeOverlay {
  constructor({canvas, container, images, onDetail = () => {}, descriptionOpen = () => false}) {
    this.canvas = canvas;
    this.container = container;
    this.images = images;
    this.onDetail = onDetail;
    this.descriptionOpen = descriptionOpen;
    this.explorer = new CostumeDetailExplorer();
    this.placements = [];
  }

  render(scene, {
    targetCanvas = this.canvas,
    clear = true,
    includeLabels = true,
    includePointers = true,
    now = performance.now()
  } = {}) {
    const {video, slots, outfits, selectedPerson, handPointers = [], detailMode = false} = scene;
    if (!video?.videoWidth) return {placements: [], project: null};
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return {placements: [], project: null};
    if (targetCanvas.width !== width || targetCanvas.height !== height) {
      targetCanvas.width = width;
      targetCanvas.height = height;
    }
    const context = targetCanvas.getContext('2d');
    if (clear) context.clearRect(0, 0, width, height);
    const project = createProjector(video, width, height);
    const placements = [];

    slots.slots.filter(slot => slot.visible).sort((a, b) => a.face.size - b.face.size).forEach(slot => {
      const placement = placementFor(slot, outfits[slot.id], project);
      drawCostume(context, placement, this.images);
      if (isRyuso(placement.kind)) placements.push(placement);
      if (includeLabels) drawLabel(context, slot, placement, selectedPerson, now);
    });

    if (!detailMode) this.explorer.reset();
    if (includePointers && detailMode && !this.descriptionOpen()) {
      const pointerState = this.explorer.update(handPointers.map(project), placements, now);
      drawPointer(context, pointerState);
      if (pointerState.activated) this.onDetail(pointerState.activated);
    }
    if (targetCanvas === this.canvas) this.placements = placements;
    return {placements, project};
  }

  activateClientPoint(clientX, clientY, now = performance.now()) {
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    const hit = this.explorer.activate({
      x: (clientX - bounds.left) * this.canvas.width / bounds.width,
      y: (clientY - bounds.top) * this.canvas.height / bounds.height
    }, this.placements, now);
    if (hit) this.onDetail(hit);
    return hit;
  }

  reset() {
    this.placements = [];
    this.explorer.reset();
    this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
