import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initHintTour} from '../assets/js/hint-tour.mjs';
import {setLanguage} from '../assets/js/language.mjs?v=20260922-2';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /id="hintBtn"[^>]*aria-controls="hintBubble"/);
assert.match(html, /id="hintBubble"[^>]*role="dialog"[^>]*hidden/);
assert.match(html, /src="assets\/js\/hint-tour\.mjs\?v=[^"]+"/);

function element(rect = {left: 20, top: 560, width: 80, height: 50}) {
  const classes = new Set();
  return {
    hidden: false, textContent: '', dataset: {}, attributes: {}, events: {},
    style: {setProperty(name, value) {this[name] = value;}},
    classList: {add(name) {classes.add(name);}, remove(name) {classes.delete(name);}, contains(name) {return classes.has(name);}},
    setAttribute(name, value) {this.attributes[name] = value;},
    addEventListener(name, listener) {this.events[name] = listener;},
    getBoundingClientRect() {return rect;},
    contains(node) {return node === this;},
    focus() {this.focused = true;},
    querySelector() {return this.label;}
  };
}

const nodes = new Map();
for (const id of ['hintBtn', 'hintBubble', 'hintTitle', 'hintBody', 'hintProgress', 'hintPrev', 'hintNext', 'hintClose', 'backBtn', 'infoBtn', 'backgroundSummary', 'detailModeBtn', 'photoBtn', 'outfitSummary']) nodes.set(id, element());
const hintButton = nodes.get('hintBtn');
hintButton.label = element();
const bubble = nodes.get('hintBubble');
bubble.hidden = true;
bubble.offsetWidth = 300;
bubble.offsetHeight = 180;
const info = nodes.get('infoBtn');
info.getBoundingClientRect = () => ({left: 309, top: 16, width: 54, height: 54});
const back = nodes.get('backBtn');
back.getBoundingClientRect = () => ({left: 12, top: 16, width: 44, height: 44});
const selectors = new Map([
  ['.person-picker', element()],
  ['#outfitSummary', nodes.get('outfitSummary')],
  ['.outfit-options', element()],
  ['.person-settings summary', element()]
]);
const events = {};
const documentRef = {
  documentElement: {lang: 'ja'}, title: '',
  getElementById: id => nodes.get(id),
  querySelector: selector => selectors.get(selector),
  querySelectorAll: () => [],
  addEventListener(name, listener) {events[name] = listener;}
};
const windowRef = {
  innerWidth: 375, innerHeight: 667, events: {},
  matchMedia: () => ({matches: false}),
  addEventListener(name, listener) {this.events[name] = listener;}
};
initHintTour(documentRef, windowRef);
assert.equal(hintButton.attributes['aria-label'], '操作のヒントを表示');
hintButton.events.click();
assert.equal(bubble.hidden, false);
assert.equal(hintButton.attributes['aria-expanded'], 'true');
assert.equal(nodes.get('hintTitle').textContent, '人物');
assert.equal(nodes.get('hintProgress').textContent, '1 / 8');
assert.equal(nodes.get('hintPrev').hidden, true);
assert(selectors.get('.person-picker').classList.contains('hint-highlight'));
assert(Number.parseFloat(bubble.style.left) >= 12);
assert(Number.parseFloat(bubble.style.top) >= 12);
assert.equal(bubble.dataset.side, 'above');

const titles = ['衣装', '背景', '部位解説', '撮影', '人物設定', '展示解説', '終了'];
for (const title of titles) {
  nodes.get('hintNext').events.click();
  assert.equal(nodes.get('hintTitle').textContent, title);
}
assert.equal(nodes.get('hintNext').textContent, '完了');
assert.equal(bubble.dataset.side, 'below');
nodes.get('hintPrev').events.click();
assert.equal(nodes.get('hintTitle').textContent, '展示解説');
setLanguage('en', documentRef);
assert.equal(hintButton.attributes['aria-label'], 'Show feature hints');
assert.equal(nodes.get('hintTitle').textContent, 'Exhibit information');
assert.match(nodes.get('hintBody').textContent, /text size/);
events.keydown({key: 'Escape', preventDefault() {this.prevented = true;}});
assert.equal(bubble.hidden, true);
assert.equal(hintButton.attributes['aria-expanded'], 'false');
assert.equal(info.classList.contains('hint-highlight'), false);

hintButton.events.click();
events.pointerdown({target: element()});
assert.equal(bubble.hidden, true, 'outside touch closes the hint');
hintButton.events.click();
nodes.get('infoBtn').events.click();
assert.equal(bubble.hidden, true, 'opening information closes the hint');
hintButton.events.click();
nodes.get('backBtn').events.click();
assert.equal(bubble.hidden, true, 'leaving AR closes the hint');
setLanguage('ja', documentRef);

console.log('PASS: eight anchored hints, narrow viewport placement, navigation, dismissal and live translation.');
