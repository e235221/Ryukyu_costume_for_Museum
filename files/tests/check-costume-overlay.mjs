import assert from 'node:assert/strict';
import {CostumeOverlay} from '../assets/js/costume-overlay.mjs';

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

console.log('PASS: bird/Ryuso rendering, placement output, rotation and balanced canvas state.');
