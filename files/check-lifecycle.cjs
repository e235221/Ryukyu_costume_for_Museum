// Run: node files/check-lifecycle.cjs (no camera or network required).
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
class Element {
  constructor() {
    this.events = {}; this.style = {}; this.dataset = {};
    const classes = new Set();
    this.classList = {add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: () => {}};
  }
  addEventListener(n, fn) { (this.events[n] ??= []).push(fn); }
  async emit(n) { for (const fn of this.events[n] ?? []) await fn(); }
  click() { return this.emit('click'); }
  querySelector() { return new Element(); }
  setAttribute() {}
  appendChild() {}
  remove() {}
  decode() { this.naturalWidth = 683; return Promise.resolve(); }
  play() { return Promise.resolve(); }
  pause() {}
  resize() {}
}
async function check() {
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  let activeTracks = 0, tracking = false, setups = 0;
  const system = {
    controller: {stopProcessVideo() {tracking = false;}},
    async _setupAR() {setups++; assert(get('ar-container').classList.contains('active')); await get('arScene').emit('arReady');},
    _resize() {assert(get('ar-container').classList.contains('active'));},
    _processVideo() {tracking = true;}
  };
  Object.assign(get('arScene'), {hasLoaded: true, systems: {'mindar-face-system': system}, renderer: {setPixelRatio() {}}});
  const document = Object.assign(new Element(), {getElementById: get, querySelectorAll: () => [], createElement: () => new Element()});
  const window = Object.assign(new Element(), {AFRAME: {}, MINDAR: {}});
  let rejectCamera = false;
  const context = {location: {protocol: 'http:'}, document, window, console, setTimeout, clearTimeout, requestAnimationFrame: fn => fn(), navigator: {mediaDevices: {async getUserMedia() {
    if (rejectCamera) throw new Error('test camera denied');
    activeTracks++;
    let stopped = false;
    return {getTracks: () => [{stop() {if (!stopped) {activeTracks--; stopped = true;}}}]};
  }}}};
  const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  for (const [, source] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInNewContext(source, context);
  assert.equal(activeTracks, 0);
  await get('startBtn').click();
  assert.equal(activeTracks, 1); assert(tracking); assert(get('loadingOverlay').classList.contains('hidden'));
  await get('backBtn').click();
  assert.equal(activeTracks, 0); assert(!tracking);
  await get('startBtn').click();
  assert.equal(activeTracks, 1); assert(tracking); assert.equal(setups, 1);
  document.hidden = true; await document.emit('visibilitychange');
  assert.equal(activeTracks, 0); assert(!tracking);
  rejectCamera = true;
  await get('startBtn').click();
  assert.equal(activeTracks, 0); assert(get('arStatus').textContent.includes('起動できません'));
  console.log('PASS: start, stop, restart, hidden-tab cleanup, camera rejection. DOM/media are mocked; real Safari/Chrome playback is not covered.');
}
check().catch(error => {console.error(error); process.exitCode = 1;});
