import assert from 'node:assert/strict';
import {CostumeOverlay} from '../assets/js/costume-overlay.mjs';
import {initCaptionPanel} from '../assets/js/caption-panel.mjs';

const operations = [];
const context = {
  clearRect() {}, save() {operations.push(['save']);}, restore() {operations.push(['restore']);},
  translate(...args) {operations.push(['translate', ...args]);}, rotate(value) {operations.push(['rotate', value]);},
  drawImage(...args) {operations.push(['draw', ...args]);}, fillRect() {}, fillText() {},
  beginPath() {}, arc() {}, fill() {}, stroke() {}
};
const canvas = {
  width: 0, height: 0,
  getContext: () => context,
  getBoundingClientRect: () => ({left: 0, top: 0, width: 1280, height: 720})
};
const container = {clientWidth: 1280, clientHeight: 720};
const images = {man: {}, woman: {}, bird: {}};
const detailHits = [];
const overlay = new CostumeOverlay({canvas, container, images, onDetail: hit => detailHits.push(hit)});
const face = {
  x: .5, y: .5, size: .1,
  left: {x: .45, y: .5}, right: {x: .55, y: .5},
  top: {x: .5, y: .4}, bottom: {x: .5, y: .6},
  eyes: [{x: .47, y: .46}, {x: .53, y: .48}]
};
const slot = {id: 0, visible: true, face, detectedAt: 0};
const video = {videoWidth: 1280, videoHeight: 720};

overlay.render({video, slots: {slots: [slot]}, outfits: ['bird'], selectedPerson: 0}, {includeLabels: false, now: 6000});
const birdDraw = operations.find(operation => operation[0] === 'draw');
assert.equal(birdDraw[1], images.bird);
assert(operations.some(operation => operation[0] === 'rotate' && operation[1] > 0));
assert.equal(operations.filter(operation => operation[0] === 'save').length, operations.filter(operation => operation[0] === 'restore').length, 'canvas state must be balanced');

operations.length = 0;
const rendered = overlay.render({video, slots: {slots: [slot]}, outfits: ['man'], selectedPerson: 0}, {includeLabels: false, now: 6000});
assert.equal(rendered.placements.length, 1);
assert.equal(rendered.placements[0].kind, 'man');
assert.equal(operations.find(operation => operation[0] === 'draw')[1], images.man);
assert.equal(operations.filter(operation => operation[0] === 'save').length, operations.filter(operation => operation[0] === 'restore').length);

const nodes = new Map();
const node = id => {
  if (!nodes.has(id)) nodes.set(id, {
    textContent: '', innerHTML: '', value: id === 'captionFontSize' ? '100' : '',
    style: {}, events: {}, classList: {
      open: false,
      add() {this.open = true;},
      remove() {this.open = false;},
      contains() {return this.open;}
    },
    addEventListener(type, listener) {this.events[type] = listener;}
  });
  return nodes.get(id);
};
const windowRef = {};
initCaptionPanel({getElementById: node}, windowRef);
const interactiveOverlay = new CostumeOverlay({
  canvas, container, images,
  descriptionOpen: () => windowRef.isCostumeDescriptionOpen(),
  onDetail: hit => windowRef.showCostumeDetail(hit.costume, hit.region)
});

function screenPoint(imagePoint, placement) {
  const dx = (imagePoint.x - placement.hole.x) * placement.factor;
  const dy = (imagePoint.y - placement.hole.y) * placement.factor;
  return {
    x: placement.center.x + Math.cos(placement.angle) * dx - Math.sin(placement.angle) * dy,
    y: placement.center.y + Math.sin(placement.angle) * dx + Math.cos(placement.angle) * dy
  };
}

const cases = [
  {kind: 'man', imagePoint: {x: 340, y: 160}, title: '男性の琉装：頭'},
  {kind: 'man', imagePoint: {x: 260, y: 510}, title: '男性の琉装：袖'},
  {kind: 'man', imagePoint: {x: 330, y: 520}, title: '男性の琉装：腰'},
  {kind: 'woman', imagePoint: {x: 340, y: 190}, title: '女性の琉装：髪'},
  {kind: 'woman', imagePoint: {x: 180, y: 420}, title: '女性の琉装：袖'},
  {kind: 'woman', imagePoint: {x: 330, y: 570}, title: '女性の琉装：腰'}
];

for (const [index, item] of cases.entries()) {
  const scene = {video, slots: {slots: [slot]}, outfits: [item.kind], selectedPerson: 0, detailMode: true};
  const now = index * 3000 + 1000;
  const {placements} = interactiveOverlay.render(scene, {includeLabels: false, now});
  const point = screenPoint(item.imagePoint, placements[0]);
  const hit = interactiveOverlay.activateClientPoint(point.x, point.y, now);
  assert(hit, `${item.title}: screen touch must hit the costume`);
  assert.equal(node('descTitle').textContent, item.title);
  assert.equal(node('descPanel').classList.contains('open'), true);
  node('closeDesc').events.click();
  assert.equal(windowRef.isCostumeDescriptionOpen(), false);

  interactiveOverlay.render({...scene, handPointers: [{x: point.x / 1280, y: point.y / 720}]}, {includeLabels: false, now: now + 1300});
  assert.equal(windowRef.isCostumeDescriptionOpen(), false, `${item.title}: finger dwell must not open immediately`);
  interactiveOverlay.render({...scene, handPointers: [{x: point.x / 1280, y: point.y / 720}]}, {includeLabels: false, now: now + 2200});
  assert.equal(node('descTitle').textContent, item.title);
  assert.equal(windowRef.isCostumeDescriptionOpen(), true, `${item.title}: finger dwell must open the caption`);
  node('closeDesc').events.click();
}

console.log('PASS: rendering, placement, six region touches and fingertip dwell open the matching captions.');
